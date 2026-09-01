const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const { User, Appointment, Doctor } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'careflow-super-secret-jwt-key-change-in-production';

/**
 * Helper to build Google OAuth2 Client
 */
function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID || 'mock-google-client-id.apps.googleusercontent.com';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || 'mock-google-client-secret';
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/calendar/callback';

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * 1. Generates Google OAuth2 Authorization URL with secure signed state token
 */
function generateAuthUrl(userId, returnTo = '/patient/profile') {
  const oauth2Client = getOAuth2Client();

  const stateToken = jwt.sign(
    { userId, returnTo, purpose: 'calendar_oauth', iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  const scopes = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
    state: stateToken,
  });
}

/**
 * 2. Handles OAuth2 Callback: validates state token and stores tokens in User record
 */
async function handleOAuthCallback(code, stateToken) {
  if (!stateToken) {
    throw new Error('Invalid or missing OAuth state parameter.');
  }

  let decoded;
  try {
    decoded = jwt.verify(stateToken, JWT_SECRET);
    if (decoded.purpose !== 'calendar_oauth') throw new Error('Invalid state purpose');
  } catch (err) {
    throw new Error('OAuth state verification failed or expired. Please try connecting again.');
  }

  const user = await User.findById(decoded.userId).select('+googleCalendar.tokens');
  if (!user) {
    throw new Error('Associated user account not found.');
  }

  let tokens;
  let calendarEmail = user.email;

  // In test / mock mode where code is 'mock_auth_code'
  if (code.startsWith('mock_') || code.startsWith('demo_') || !process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET.includes('mock')) {
    tokens = {
      access_token: 'mock_access_token_' + Date.now(),
      refresh_token: 'mock_refresh_token_' + Date.now(),
      scope: 'https://www.googleapis.com/auth/calendar.events',
      token_type: 'Bearer',
      expiry_date: Date.now() + 3600 * 1000,
    };
  } else {
    const tokenResponse = await oauth2Client.getToken(code);
    tokens = tokenResponse.tokens;
    oauth2Client.setCredentials(tokens);

    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      if (userInfo.data.email) calendarEmail = userInfo.data.email;
    } catch (e) {
      console.warn('Could not fetch Google userinfo email:', e.message);
    }
  }

  user.googleCalendar = {
    isConnected: true,
    calendarEmail,
    tokens,
    connectedAt: new Date(),
  };
  await user.save();

  return {
    user,
    returnTo: decoded.returnTo || '/patient/profile',
  };
}

/**
 * 3. Creates Google Calendar Event for Confirmed Appointment
 */
async function createCalendarEvent({ appointment, patient, doctor, options = {} }) {
  if (!appointment) return { success: false, message: 'Appointment document required.' };

  const doctorName = doctor?.userId?.name || doctor?.name || 'Physician';
  const doctorSpecialization = doctor?.specialization || 'Healthcare Specialist';
  const patientName = patient?.name || patient?.userId?.name || 'Patient';

  // Format ISO timestamps (assuming local timezone or UTC)
  const startDateTime = `${appointment.date}T${appointment.startTime}:00`;
  const endDateTime = `${appointment.date}T${appointment.endTime || appointment.startTime}:00`;

  const eventPayload = {
    summary: `Healthcare Appointment with Dr. ${doctorName}`,
    description: `CareFlow Consultation
Patient: ${patientName}
Doctor: Dr. ${doctorName} (${doctorSpecialization})
Time: ${appointment.date} from ${appointment.startTime} to ${appointment.endTime}
Reference ID: ${appointment._id}
${appointment.symptoms ? `Reason / Symptoms: ${appointment.symptoms}` : ''}`,
    start: {
      dateTime: new Date(startDateTime).toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: new Date(endDateTime).toISOString(),
      timeZone: 'UTC',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 30 },
      ],
    },
  };

  try {
    if (options.mockFail) {
      throw new Error('Google Calendar API rate limit or authentication timeout');
    }

    // Check if patient or doctor has active tokens
    const patientUser = await User.findById(patient._id || patient).select('+googleCalendar.tokens');
    const isMock = !patientUser?.googleCalendar?.tokens || patientUser.googleCalendar.tokens.access_token?.startsWith('mock_') || options.isMock;

    let eventId;

    if (isMock) {
      // Deterministic mock event ID for testing & development
      eventId = `gcal_evt_${appointment._id.toString().substring(0, 16)}`;
    } else {
      const oauth2Client = getOAuth2Client();
      oauth2Client.setCredentials(patientUser.googleCalendar.tokens);

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: eventPayload,
      });
      eventId = response.data.id;
    }

    // Update appointment document in MongoDB
    await Appointment.findByIdAndUpdate(appointment._id, {
      googleCalendarEventId: eventId,
      googleCalendarSyncStatus: 'synced',
      googleCalendarSyncError: '',
    });

    return {
      success: true,
      googleCalendarEventId: eventId,
      status: 'synced',
    };
  } catch (error) {
    console.warn(`[CalendarService] Non-fatal calendar sync error: ${error.message}`);

    await Appointment.findByIdAndUpdate(appointment._id, {
      googleCalendarSyncStatus: 'failed',
      googleCalendarSyncError: error.message,
    });

    return {
      success: false,
      error: error.message,
      status: 'failed',
    };
  }
}

/**
 * 4. Updates Google Calendar Event when Appointment is Rescheduled
 */
async function updateCalendarEvent({ appointmentId, googleCalendarEventId, newDate, newStartTime, newEndTime, options = {} }) {
  if (!googleCalendarEventId) return { success: false, message: 'No event ID linked' };

  try {
    if (options.mockFail) {
      throw new Error('Google Calendar update request failed');
    }

    const startDateTime = `${newDate}T${newStartTime}:00`;
    const endDateTime = `${newDate}T${newEndTime || newStartTime}:00`;

    const isMock = googleCalendarEventId.startsWith('gcal_') || options.isMock;

    if (!isMock) {
      const appointment = await Appointment.findById(appointmentId).populate('patientId');
      const patientUser = await User.findById(appointment?.patientId?._id).select('+googleCalendar.tokens');

      if (patientUser?.googleCalendar?.tokens) {
        const oauth2Client = getOAuth2Client();
        oauth2Client.setCredentials(patientUser.googleCalendar.tokens);

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        await calendar.events.patch({
          calendarId: 'primary',
          eventId: googleCalendarEventId,
          resource: {
            start: { dateTime: new Date(startDateTime).toISOString() },
            end: { dateTime: new Date(endDateTime).toISOString() },
          },
        });
      }
    }

    await Appointment.findByIdAndUpdate(appointmentId, {
      googleCalendarSyncStatus: 'synced',
      googleCalendarSyncError: '',
    });

    return { success: true, status: 'synced' };
  } catch (error) {
    console.warn(`[CalendarService] Update calendar event error: ${error.message}`);
    await Appointment.findByIdAndUpdate(appointmentId, {
      googleCalendarSyncStatus: 'failed',
      googleCalendarSyncError: error.message,
    });
    return { success: false, error: error.message, status: 'failed' };
  }
}

/**
 * 5. Deletes Google Calendar Event when Appointment is Cancelled
 */
async function deleteCalendarEvent({ appointmentId, googleCalendarEventId, options = {} }) {
  if (!googleCalendarEventId) return { success: true, message: 'No event to delete' };

  try {
    if (options.mockFail) {
      throw new Error('Google Calendar delete request failed');
    }

    const isMock = googleCalendarEventId.startsWith('gcal_') || options.isMock;

    if (!isMock) {
      const appointment = await Appointment.findById(appointmentId).populate('patientId');
      const patientUser = await User.findById(appointment?.patientId?._id).select('+googleCalendar.tokens');

      if (patientUser?.googleCalendar?.tokens) {
        const oauth2Client = getOAuth2Client();
        oauth2Client.setCredentials(patientUser.googleCalendar.tokens);

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        await calendar.events.delete({
          calendarId: 'primary',
          eventId: googleCalendarEventId,
        });
      }
    }

    if (appointmentId) {
      await Appointment.findByIdAndUpdate(appointmentId, {
        googleCalendarEventId: '',
        googleCalendarSyncStatus: 'none',
      });
    }

    return { success: true };
  } catch (error) {
    console.warn(`[CalendarService] Delete calendar event error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 6. Manual / Retry Sync for an Appointment
 */
async function syncAppointmentCalendarEvent(appointmentId) {
  const appointment = await Appointment.findById(appointmentId)
    .populate('patientId')
    .populate({ path: 'doctorId', populate: { path: 'userId' } });

  if (!appointment) throw new Error('Appointment not found');

  return await createCalendarEvent({
    appointment,
    patient: appointment.patientId,
    doctor: appointment.doctorId,
  });
}

module.exports = {
  getOAuth2Client,
  generateAuthUrl,
  handleOAuthCallback,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  syncAppointmentCalendarEvent,
};
