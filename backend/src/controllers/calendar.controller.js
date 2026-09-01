const {
  generateAuthUrl,
  handleOAuthCallback,
  syncAppointmentCalendarEvent,
} = require('../services/calendarService');
const { User, Appointment } = require('../models');

// @desc    Initiate Google Calendar OAuth flow
// @route   GET /api/calendar/connect
// @access  Private (Patient or Doctor)
exports.connectGoogleCalendar = async (req, res, next) => {
  try {
    const returnTo = req.query.returnTo || (req.user.role === 'doctor' ? '/doctor/profile' : '/patient/profile');
    const authUrl = generateAuthUrl(req.user._id, returnTo);

    // If request accepts JSON or wants JSON payload
    if (req.headers.accept?.includes('application/json') || req.query.json === 'true') {
      return res.status(200).json({
        success: true,
        data: { authUrl },
      });
    }

    res.redirect(authUrl);
  } catch (error) {
    next(error);
  }
};

// @desc    Handle Google Calendar OAuth callback
// @route   GET /api/calendar/callback
// @access  Public (Callback from Google)
exports.handleGoogleCallback = async (req, res, next) => {
  try {
    const { code, state, error } = req.query;

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    if (error) {
      console.warn('Google OAuth denied by user:', error);
      return res.redirect(`${clientUrl}/patient/profile?calendarError=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
      return res.redirect(`${clientUrl}/patient/profile?calendarError=Missing_OAuth_Parameters`);
    }

    const { user, returnTo } = await handleOAuthCallback(code, state);

    res.redirect(`${clientUrl}${returnTo}?calendarConnected=true&email=${encodeURIComponent(user.googleCalendar?.calendarEmail || user.email)}`);
  } catch (err) {
    console.error('Google OAuth callback error:', err.message);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/patient/profile?calendarError=${encodeURIComponent(err.message)}`);
  }
};

// @desc    Get Google Calendar Connection Status
// @route   GET /api/calendar/status
// @access  Private
exports.getCalendarStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: {
        isConnected: Boolean(user?.googleCalendar?.isConnected),
        calendarEmail: user?.googleCalendar?.calendarEmail || '',
        connectedAt: user?.googleCalendar?.connectedAt || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Disconnect Google Calendar
// @route   POST /api/calendar/disconnect
// @access  Private
exports.disconnectGoogleCalendar = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.googleCalendar = {
        isConnected: false,
        calendarEmail: '',
        tokens: null,
        connectedAt: null,
      };
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Google Calendar integration disconnected.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Retry syncing an appointment to Google Calendar
// @route   POST /api/calendar/sync/:appointmentId
// @access  Private
exports.retrySyncAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const result = await syncAppointmentCalendarEvent(appointmentId);

    const updated = await Appointment.findById(appointmentId);

    res.status(200).json({
      success: result.success,
      message: result.success
        ? 'Appointment synchronized with Google Calendar.'
        : `Calendar synchronization failed: ${result.error}`,
      data: {
        googleCalendarEventId: updated.googleCalendarEventId,
        googleCalendarSyncStatus: updated.googleCalendarSyncStatus,
        googleCalendarSyncError: updated.googleCalendarSyncError,
      },
    });
  } catch (error) {
    next(error);
  }
};
