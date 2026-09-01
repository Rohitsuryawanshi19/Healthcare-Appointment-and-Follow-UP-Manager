const mongoose = require('mongoose');
require('dotenv').config();

const { User, Doctor, Appointment, Prescription, Notification, DoctorLeave } = require('../models');
const { generatePreVisitSummary, generatePostVisitSummary } = require('../services/aiService');
const {
  sendBookingConfirmation,
  sendAppointmentReminder,
  sendCancellationEmail,
  sendDoctorLeaveNotification,
  retryPendingAndFailedEmails,
} = require('../services/emailService');
const {
  generateAuthUrl,
  handleOAuthCallback,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  syncAppointmentCalendarEvent,
} = require('../services/calendarService');

async function runMasterTestSuite() {
  console.log('===============================================================');
  console.log('🧪 CAREFLOW FULL-PLATFORM MASTER VALIDATION & TESTING SUITE');
  console.log('===============================================================\n');

  const connUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/careflow';
  await mongoose.connect(connUri);

  const baseURL = 'http://localhost:5000/api';
  const testResults = [];

  function record(category, testName, passed, details = '') {
    testResults.push({ category, testName, passed, details });
    const statusMark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`[${statusMark}] ${category} -> ${testName} ${details ? `(${details})` : ''}`);
  }

  try {
    // ==========================================
    // 1. AUTHENTICATION & ROLE AUTHORIZATION
    // ==========================================
    console.log('\n--- 1. AUTHENTICATION & ROLE AUTHORIZATION ---');
    const testEmail = `auth.test.${Date.now()}@demo.com`;

    // 1.1 Registration
    const regRes = await fetch(`${baseURL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Auth Test User',
        email: testEmail,
        password: 'DemoPassword123!',
        phone: '+1 555-0100',
      }),
    });
    const regData = await regRes.json();
    record('Auth', 'Registration', regRes.status === 201 && regData.data?.user?.role === 'patient', `Status ${regRes.status}`);

    // 1.2 Login
    const loginRes = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'DemoPassword123!' }),
    });
    const loginData = await loginRes.json();
    const userCookie = loginRes.headers.get('set-cookie');
    record('Auth', 'Login', loginRes.status === 200 && Boolean(loginData.data?.token), `Status ${loginRes.status}`);

    // 1.3 Logout
    const logoutRes = await fetch(`${baseURL}/auth/logout`, {
      method: 'POST',
      headers: { Cookie: userCookie },
    });
    record('Auth', 'Logout', logoutRes.status === 200, `Status ${logoutRes.status}`);

    // 1.4 Unauthorized Access
    const unauthRes = await fetch(`${baseURL}/patient/profile`);
    record('Auth', 'Unauthorized Access Blocked', unauthRes.status === 401, `Status ${unauthRes.status}`);

    // 1.5 Role Authorization
    const patientOnlyRes = await fetch(`${baseURL}/auth/patient-only`, { headers: { Cookie: userCookie } });
    const doctorOnlyRes = await fetch(`${baseURL}/auth/doctor-only`, { headers: { Cookie: userCookie } });
    record('Auth', 'Patient Role Access', patientOnlyRes.status === 200, `Status ${patientOnlyRes.status}`);
    record('Auth', 'Doctor Portal Forbidden to Patient', doctorOnlyRes.status === 403, `Status ${doctorOnlyRes.status}`);

    await User.deleteOne({ email: testEmail });

    // Login default Admin, Doctor, and Patient accounts
    const adminLogin = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@demo.com', password: 'DemoPassword123!' }),
    });
    const adminCookie = adminLogin.headers.get('set-cookie');

    const docLogin = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'doctor@demo.com', password: 'DemoPassword123!' }),
    });
    const docCookie = docLogin.headers.get('set-cookie');

    const patientLogin = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'patient.a@demo.com', password: 'DemoPassword123!' }),
    });
    const patientCookie = patientLogin.headers.get('set-cookie');

    const docUser = await User.findOne({ email: 'doctor@demo.com' });
    const doctor = await Doctor.findOne({ userId: docUser._id }).populate('userId');
    const patientAlice = await User.findOne({ email: 'patient.a@demo.com' });

    // ==========================================
    // 2. DOCTOR MANAGEMENT
    // ==========================================
    console.log('\n--- 2. DOCTOR MANAGEMENT & LIFECYCLE ---');

    // 2.1 Create Doctor
    const newDocEmail = `dr.test.${Date.now()}@demo.com`;
    const createDocRes = await fetch(`${baseURL}/admin/doctors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        name: 'Dr. Test Specialist',
        email: newDocEmail,
        password: 'DemoPassword123!',
        phone: '+1 555-0999',
        specialization: 'Neurology',
        qualification: 'DM (Neurology), MD, MBBS',
        registrationNumber: `DEMO-REG-NEURO-${Date.now()}`,
        registrationCouncil: 'CareFlow Synthetic Demo Registry (Development Only)',
        experience: 8,
        consultationFee: 750,
      }),
    });
    const createDocData = await createDocRes.json();
    const createdDocId = createDocData.data?._id;
    record('Doctor', 'Create Doctor', createDocRes.status === 201 && Boolean(createdDocId), `Doc ID: ${createdDocId}`);

    // 2.2 Update Doctor Profile
    const updateDocRes = await fetch(`${baseURL}/admin/doctors/${createdDocId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        consultationFee: 850,
        experience: 9,
      }),
    });
    record('Doctor', 'Update Doctor', updateDocRes.status === 200, `Status ${updateDocRes.status}`);

    // 2.3 Verification Status Transitions
    const verifyDocRes = await fetch(`${baseURL}/admin/doctors/${createdDocId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ status: 'verified' }),
    });
    record('Doctor', 'Verify Doctor Credentials', verifyDocRes.status === 200, `Status ${verifyDocRes.status}`);

    // 2.4 Doctor Leave Management
    const leaveDate = '2026-12-15';
    const leaveRes = await fetch(`${baseURL}/admin/doctors/${createdDocId}/leaves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ date: leaveDate, reason: 'Neurology Symposium' }),
    });
    record('Doctor', 'Doctor Scheduled Leave', leaveRes.status === 201, `Status ${leaveRes.status}`);

    // Clean test doctor
    await DoctorLeave.deleteMany({ doctorId: createdDocId });
    await Doctor.findByIdAndDelete(createdDocId);
    await User.deleteOne({ email: newDocEmail });

    // ==========================================
    // 3. APPOINTMENTS & CONCURRENCY
    // ==========================================
    console.log('\n--- 3. APPOINTMENTS & CONCURRENCY ---');
    const apptDate = '2026-11-10';
    const apptSlot = '15:00';
    await Appointment.deleteMany({ doctorId: doctor._id, date: apptDate, startTime: apptSlot });

    // 3.1 Booking
    const bookRes = await fetch(`${baseURL}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: patientCookie },
      body: JSON.stringify({
        doctorId: doctor._id.toString(),
        date: apptDate,
        startTime: apptSlot,
        symptoms: 'Mild headache and eye strain for 2 days.',
      }),
    });
    const bookData = await bookRes.json();
    const apptId = bookData.data?._id;
    record('Appointments', 'Booking Confirmation', bookRes.status === 201 && bookData.data?.status === 'confirmed', `Appt ID: ${apptId}`);

    // 3.2 Simultaneous Booking Attempt (Double Booking Protection)
    const duplicateBookRes = await fetch(`${baseURL}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: patientCookie },
      body: JSON.stringify({
        doctorId: doctor._id.toString(),
        date: apptDate,
        startTime: apptSlot,
        symptoms: 'Second patient collision attempt.',
      }),
    });
    record('Appointments', 'Simultaneous Booking Collision Protection', duplicateBookRes.status === 409, `Status ${duplicateBookRes.status}`);

    // 3.3 Rescheduling
    const newSlot = '16:00';
    const reschedRes = await fetch(`${baseURL}/appointments/${apptId}/reschedule`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: patientCookie },
      body: JSON.stringify({
        newDate: apptDate,
        newStartTime: newSlot,
      }),
    });
    record('Appointments', 'Rescheduling', reschedRes.status === 200, `Status ${reschedRes.status}`);

    // 3.4 Cancellation
    const cancelRes = await fetch(`${baseURL}/appointments/${apptId}/cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: patientCookie },
      body: JSON.stringify({ reason: 'Schedule conflict resolved.' }),
    });
    record('Appointments', 'Cancellation', cancelRes.status === 200, `Status ${cancelRes.status}`);

    // 3.5 Slot Hold Expiration Simulation
    const holdDate = '2026-11-11';
    const holdSlot = '10:00';
    await Appointment.deleteMany({ doctorId: doctor._id, date: holdDate, startTime: holdSlot });
    const expiredHold = await Appointment.create({
      patientId: patientAlice._id,
      doctorId: doctor._id,
      date: holdDate,
      startTime: holdSlot,
      endTime: '10:30',
      status: 'held',
      heldAt: new Date(Date.now() - 600000), // 10 minutes ago
      expiresAt: new Date(Date.now() - 300000), // 5 minutes ago
    });
    const confirmExpiredRes = await fetch(`${baseURL}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: patientCookie },
      body: JSON.stringify({
        heldAppointmentId: expiredHold._id.toString(),
      }),
    });
    record('Appointments', 'Expired Slot Hold Rejection', confirmExpiredRes.status === 409, `Status ${confirmExpiredRes.status}`);

    await Appointment.deleteMany({ doctorId: doctor._id, date: { $in: [apptDate, holdDate] } });

    // ==========================================
    // 4. AI PRE-VISIT & POST-VISIT SERVICES
    // ==========================================
    console.log('\n--- 4. AI SERVICES & ERROR RESILIENCY ---');

    // 4.1 Successful Pre-Visit AI Summary
    const preVisitSuccess = await generatePreVisitSummary('High fever of 102F with chills and throbbing headache for 24 hours.');
    record(
      'AI',
      'Pre-Visit AI Summary (Valid)',
      Boolean(preVisitSuccess.chiefComplaint) && Boolean(preVisitSuccess.urgency),
      `Urgency: ${preVisitSuccess.urgency}`
    );

    // 4.2 Malformed & Empty Symptom Input Handling
    const preVisitEmpty = await generatePreVisitSummary('');
    record(
      'AI',
      'Malformed/Empty Input Handling',
      Boolean(preVisitEmpty.chiefComplaint) && preVisitEmpty.urgency === 'Low',
      'Handled gracefully'
    );

    // 4.3 Post-Visit AI Care Plan
    const postVisitSuccess = await generatePostVisitSummary({
      diagnosis: 'Acute Sinusitis',
      doctorNotes: 'Maxillary sinus tenderness with purulent nasal discharge.',
      medicines: [{ name: 'Amoxicillin', dosage: '500mg', frequency: 'Three times daily', duration: '7 days' }],
      followUpInstructions: 'Review in 7 days if congestion persists.',
    });
    record(
      'AI',
      'Post-Visit AI Care Plan (Valid)',
      Boolean(postVisitSuccess.whatWasDiscussed) && postVisitSuccess.medicationSchedule.length > 0,
      '5-part care plan generated'
    );

    // ==========================================
    // 5. TRANSACTIONAL EMAIL NOTIFICATIONS
    // ==========================================
    console.log('\n--- 5. TRANSACTIONAL EMAIL NOTIFICATIONS ---');

    // 5.1 Success Dispatch
    const emailBooking = await sendBookingConfirmation({
      appointment: { _id: new mongoose.Types.ObjectId(), date: '2026-11-12', startTime: '10:00', endTime: '10:30', symptoms: 'Annual checkup' },
      patient: { name: 'Alice Johnson', email: 'patient.a@demo.com' },
      doctor: { userId: { name: 'Dr. Rahul Mehta', email: 'doctor@demo.com' }, specialization: 'General Medicine' },
    });
    record('Email', 'Booking Confirmation Dispatch', emailBooking.length >= 1 && emailBooking[0]?.success, 'Sent to Patient & Doctor');

    // 5.2 Failure & Retry Worker
    const failedNotice = await Notification.create({
      userId: patientAlice._id,
      type: 'appointment_reminder',
      channel: 'email',
      title: 'Reminder Notice',
      message: 'Consultation scheduled today.',
      status: 'failed',
      retryCount: 1,
      metadata: { to: 'patient.a@demo.com', subject: 'Reminder Notice' },
    });
    const retryRes = await retryPendingAndFailedEmails();
    record('Email', 'Background Retry Worker', retryRes.retriedCount >= 1 && retryRes.succeededCount >= 1, `Recovered: ${retryRes.succeededCount}`);
    await Notification.findByIdAndDelete(failedNotice._id);

    // ==========================================
    // 6. GOOGLE CALENDAR INTEGRATION
    // ==========================================
    console.log('\n--- 6. GOOGLE CALENDAR INTEGRATION ---');

    // 6.1 Connect OAuth URL
    const authUrl = generateAuthUrl(patientAlice._id.toString(), '/patient/profile');
    record('Calendar', 'OAuth URL Generation', authUrl.includes('accounts.google.com') && authUrl.includes('state='), 'Signed state token attached');

    // 6.2 Token Exchange & Storage
    const fakeOAuthCode = `demo_oauth_code_${Date.now()}`;
    const stateToken = authUrl.split('state=')[1]?.split('&')[0];
    const callbackRes = await handleOAuthCallback(fakeOAuthCode, stateToken);
    record('Calendar', 'Token Exchange & DB Persistence', Boolean(callbackRes.user?.googleCalendar?.isConnected), 'Saved securely');

    // 6.3 Event Creation
    const calEvent = await createCalendarEvent({
      appointment: { _id: new mongoose.Types.ObjectId(), date: '2026-11-15', startTime: '11:00', endTime: '11:30', symptoms: 'Checkup' },
      patient: patientAlice,
      doctor: { userId: { name: 'Dr. Aisha Verma' }, specialization: 'Cardiology' },
    });
    record('Calendar', 'Create Calendar Event', calEvent.success && Boolean(calEvent.googleCalendarEventId), `ID: ${calEvent.googleCalendarEventId}`);

    // 6.4 Event Rescheduling
    const calUpdate = await updateCalendarEvent({
      appointmentId: new mongoose.Types.ObjectId(),
      googleCalendarEventId: calEvent.googleCalendarEventId,
      newDate: '2026-11-16',
      newStartTime: '14:00',
      newEndTime: '14:30',
    });
    record('Calendar', 'Update Event on Reschedule', calUpdate.success, 'Event updated');

    // 6.5 Event Deletion
    const calDelete = await deleteCalendarEvent({
      appointmentId: new mongoose.Types.ObjectId(),
      googleCalendarEventId: calEvent.googleCalendarEventId,
    });
    record('Calendar', 'Delete Event on Cancellation', calDelete.success, 'Event removed');

    // ==========================================
    // 7. SECURITY & ACCESS CONTROL (IDOR)
    // ==========================================
    console.log('\n--- 7. SECURITY & IDOR ACCESS CONTROL ---');

    const patientBLogin = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'patient.b@demo.com', password: 'DemoPassword123!' }),
    });
    const patientBCookie = patientBLogin.headers.get('set-cookie');
    const patientB = await User.findOne({ email: 'patient.b@demo.com' });

    // Create Alice's private record
    const secretAppt = await Appointment.create({
      patientId: patientAlice._id,
      doctorId: doctor._id,
      date: '2026-11-25',
      startTime: '16:30',
      endTime: '17:00',
      status: 'confirmed',
      symptoms: 'Sensitive patient medical history',
    });

    // 7.1 Patient B accessing Patient A's appointment
    const idorReadRes = await fetch(`${baseURL}/patient/appointments/${secretAppt._id}`, {
      headers: { Cookie: patientBCookie },
    });
    record('Security', 'IDOR Cross-Patient Read Blocked', idorReadRes.status === 404, `Status ${idorReadRes.status}`);

    // 7.2 Patient B cancelling Patient A's appointment
    const idorCancelRes = await fetch(`${baseURL}/appointments/${secretAppt._id}/cancel`, {
      method: 'PATCH',
      headers: { Cookie: patientBCookie },
    });
    record('Security', 'IDOR Cross-Patient Write Blocked', idorCancelRes.status === 403, `Status ${idorCancelRes.status}`);

    // 7.3 Patient accessing Doctor consultation submit
    const patientSubmitConsultRes = await fetch(`${baseURL}/doctor/appointments/${secretAppt._id}/consultation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: patientCookie },
      body: JSON.stringify({ doctorNotes: 'Malicious modification' }),
    });
    record('Security', 'Patient Forbidden on Doctor Workspace', patientSubmitConsultRes.status === 403, `Status ${patientSubmitConsultRes.status}`);

    // 7.4 Admin system access verification
    const adminAccessRes = await fetch(`${baseURL}/admin/stats`, {
      headers: { Cookie: adminCookie },
    });
    record('Security', 'Admin Role Authorization', adminAccessRes.status === 200, `Status ${adminAccessRes.status}`);

    await Appointment.findByIdAndDelete(secretAppt._id);

    console.log('\n===============================================================');
    console.log('📊 MASTER TEST SUITE RESULTS SUMMARY');
    console.log('===============================================================');
    const totalTests = testResults.length;
    const passedTests = testResults.filter((t) => t.passed).length;
    const failedTests = totalTests - passedTests;

    console.log(`Total Validation Assertions: ${totalTests}`);
    console.log(`Passed:                      ${passedTests}`);
    console.log(`Failed:                      ${failedTests}`);
    console.log(`Success Rate:                ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log('===============================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    }
    process.exit(0);
  } catch (error) {
    console.error('Master Test Suite Fatal Error:', error);
    process.exit(1);
  }
}

runMasterTestSuite();
