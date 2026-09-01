const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { User, Doctor, Appointment } = require('../models');
const {
  generateAuthUrl,
  handleOAuthCallback,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  syncAppointmentCalendarEvent,
} = require('../services/calendarService');

async function testGoogleCalendarIntegration() {
  console.log('=== STARTING GOOGLE CALENDAR INTEGRATION TEST SUITE ===\n');

  const connUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/careflow';
  await mongoose.connect(connUri);

  const baseURL = 'http://localhost:5000/api';

  const patient = await User.findOne({ email: 'patient.a@demo.com' });
  const doctor = await Doctor.findOne({ verificationStatus: 'verified' }).populate('userId');

  // Authenticate Patient
  const patientLogin = await fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'patient.a@demo.com', password: 'DemoPassword123!' }),
  });
  const patientCookie = patientLogin.headers.get('set-cookie');

  // --- TEST 1: GOOGLE OAUTH 2.0 CONNECT & CALLBACK ---
  console.log('--- TEST 1: GOOGLE OAUTH 2.0 URL GENERATION & CALLBACK ---');
  const connectRes = await fetch(`${baseURL}/calendar/connect?json=true`, {
    headers: { Cookie: patientCookie },
  });
  const connectData = await connectRes.json();
  console.log(`Connect Status: ${connectRes.status}`);
  console.log('Auth URL Generated:', connectData.data?.authUrl?.substring(0, 80) + '...');

  if (!connectData.data?.authUrl || !connectData.data.authUrl.includes('accounts.google.com')) {
    throw new Error('Test 1 Failed: Google OAuth URL generation failed');
  }

  // Extract state token from URL
  const urlObj = new URL(connectData.data.authUrl);
  const stateToken = urlObj.searchParams.get('state');

  // Verify OAuth Callback handling
  const callbackResult = await handleOAuthCallback('mock_google_auth_code_123', stateToken);
  console.log(`Callback Handled Successfully for: ${callbackResult.user.email}`);

  const statusRes = await fetch(`${baseURL}/calendar/status`, {
    headers: { Cookie: patientCookie },
  });
  const statusData = await statusRes.json();
  console.log('Calendar Connected Status in DB:', statusData.data);

  if (!statusData.data?.isConnected) {
    throw new Error('Test 1 Failed: Google Calendar connection not established in DB');
  }

  // --- TEST 2: CREATE GOOGLE CALENDAR EVENT ---
  console.log('\n--- TEST 2: CREATE GOOGLE CALENDAR EVENT ON BOOKING ---');
  const testDate = '2026-11-12';
  const testSlot = '10:00';
  await Appointment.deleteMany({ doctorId: doctor._id, date: testDate });

  const appt = await Appointment.create({
    patientId: patient._id,
    doctorId: doctor._id,
    date: testDate,
    startTime: testSlot,
    endTime: '10:30',
    status: 'confirmed',
    symptoms: 'Quarterly cardiovascular review.',
  });

  const eventResult = await createCalendarEvent({
    appointment: appt,
    patient,
    doctor,
  });
  console.log('Create Event Result:', eventResult);

  const checkCreated = await Appointment.findById(appt._id);
  console.log('Saved Google Calendar Event ID:', checkCreated.googleCalendarEventId);
  console.log('Google Calendar Sync Status:', checkCreated.googleCalendarSyncStatus);

  if (!checkCreated.googleCalendarEventId || checkCreated.googleCalendarSyncStatus !== 'synced') {
    throw new Error('Test 2 Failed: Google Calendar event ID was not stored on appointment');
  }

  // --- TEST 3: RESCHEDULE EVENT ---
  console.log('\n--- TEST 3: RESCHEDULE GOOGLE CALENDAR EVENT ---');
  const reschedResult = await updateCalendarEvent({
    appointmentId: appt._id,
    googleCalendarEventId: checkCreated.googleCalendarEventId,
    newDate: '2026-11-13',
    newStartTime: '11:00',
    newEndTime: '11:30',
  });
  console.log('Update Event Result:', reschedResult);

  if (!reschedResult.success) {
    throw new Error('Test 3 Failed: Google Calendar event update failed');
  }

  // --- TEST 4: CANCEL EVENT (DELETE FROM CALENDAR) ---
  console.log('\n--- TEST 4: CANCEL EVENT (DELETE FROM CALENDAR) ---');
  const deleteResult = await deleteCalendarEvent({
    appointmentId: appt._id,
    googleCalendarEventId: checkCreated.googleCalendarEventId,
  });
  console.log('Delete Event Result:', deleteResult);

  const checkDeleted = await Appointment.findById(appt._id);
  console.log('Event ID after Cancellation in DB:', checkDeleted.googleCalendarEventId || 'EMPTY (Cleared)');

  if (checkDeleted.googleCalendarEventId !== '') {
    throw new Error('Test 4 Failed: Event ID was not cleared after cancellation');
  }

  // --- TEST 5: API FAILURE TOLERANCE & RETRY SYNC ---
  console.log('\n--- TEST 5: API FAILURE RESILIENCY & RETRY ENDPOINT ---');
  const failEventRes = await createCalendarEvent({
    appointment: appt,
    patient,
    doctor,
    options: { mockFail: true },
  });
  console.log('Simulated API Failure Output:', failEventRes);

  const checkFailed = await Appointment.findById(appt._id);
  console.log('Appointment Maintained Status:', checkFailed.status);
  console.log('Sync Status in DB:', checkFailed.googleCalendarSyncStatus);
  console.log('Error Logged in DB:', checkFailed.googleCalendarSyncError);

  if (checkFailed.status !== 'confirmed' || checkFailed.googleCalendarSyncStatus !== 'failed') {
    throw new Error('Test 5 Failed: API failure did not gracefully set sync status to failed');
  }

  // Test Retry Sync Endpoint
  const retrySyncRes = await fetch(`${baseURL}/calendar/sync/${appt._id}`, {
    method: 'POST',
    headers: { Cookie: patientCookie },
  });
  const retrySyncData = await retrySyncRes.json();
  console.log('Retry Sync Endpoint Status:', retrySyncRes.status);
  console.log('Recovered Event ID:', retrySyncData.data?.googleCalendarEventId);

  if (!retrySyncData.data?.googleCalendarEventId) {
    throw new Error('Test 5 Failed: Retry sync endpoint did not recover calendar event');
  }

  // Clean test records
  await Appointment.deleteMany({ doctorId: doctor._id, date: testDate });

  console.log('\nALL GOOGLE CALENDAR INTEGRATION TESTS PASSED PERFECTLY!');
  process.exit(0);
}

testGoogleCalendarIntegration().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
