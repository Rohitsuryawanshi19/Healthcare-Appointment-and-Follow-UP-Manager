const mongoose = require('mongoose');
require('dotenv').config();

const { User, Doctor, Appointment, DoctorLeave, Notification } = require('../models');

async function testHardenedDoctorLeave() {
  console.log('=== STARTING HARDENED DOCTOR LEAVE MANAGEMENT TEST SUITE ===\n');

  const connUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/careflow';
  await mongoose.connect(connUri);

  const baseURL = 'http://localhost:5000/api';

  // 1. Authenticate Admin and Patient
  const adminLogin = await fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@demo.com', password: 'DemoPassword123!' }),
  });
  const adminCookie = adminLogin.headers.get('set-cookie');

  const patientLogin = await fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'patient.a@demo.com', password: 'DemoPassword123!' }),
  });
  const patientCookie = patientLogin.headers.get('set-cookie');

  const doctor = await Doctor.findOne({ verificationStatus: 'verified' }).populate('userId');
  const patientA = await User.findOne({ email: 'patient.a@demo.com' });

  const testDate1 = '2026-11-20';
  const testDate2 = '2026-11-21';

  // Clean test leave records
  await DoctorLeave.deleteMany({ doctorId: doctor._id, date: { $in: [testDate1, testDate2] } });
  await Appointment.deleteMany({ doctorId: doctor._id, date: { $in: [testDate1, testDate2] } });

  // --- TEST 1: LEAVE WITH NO APPOINTMENTS ---
  console.log('--- TEST 1: LEAVE WITH NO APPOINTMENTS ---');
  const previewRes1 = await fetch(`${baseURL}/admin/doctors/${doctor._id}/leave-preview?date=${testDate1}`, {
    headers: { Cookie: adminCookie },
  });
  const previewData1 = await previewRes1.json();
  console.log(`Preview Affected Appointments Count: ${previewData1.data?.affectedCount} (Expected: 0)`);

  const leaveRes1 = await fetch(`${baseURL}/admin/doctors/${doctor._id}/leaves`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ date: testDate1, reason: 'Conference Attendance' }),
  });
  const leaveData1 = await leaveRes1.json();
  console.log(`Leave Creation Status: ${leaveRes1.status}, Message: "${leaveData1.message}"`);

  if (leaveRes1.status !== 201 || leaveData1.data?.affectedCount !== 0) {
    throw new Error('Test 1 Failed: Leave with no appointments failed');
  }

  // --- TEST 2: REPEATED LEAVE PREVENTION (409 CONFLICT) ---
  console.log('\n--- TEST 2: REPEATED LEAVE PREVENTION ---');
  const repeatRes = await fetch(`${baseURL}/admin/doctors/${doctor._id}/leaves`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ date: testDate1, reason: 'Duplicate Leave Attempt' }),
  });
  const repeatData = await repeatRes.json();
  console.log(`Repeated Leave Status: ${repeatRes.status} (Expected: 409), Message: "${repeatData.message}"`);

  if (repeatRes.status !== 409) {
    throw new Error('Test 2 Failed: Repeated leave was not rejected with 409 Conflict');
  }

  // --- TEST 3: BOOKING DURING LEAVE (PREVENT NEW BOOKINGS) ---
  console.log('\n--- TEST 3: PREVENT BOOKING DURING SCHEDULED LEAVE ---');
  const bookRes = await fetch(`${baseURL}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: patientCookie },
    body: JSON.stringify({
      doctorId: doctor._id.toString(),
      date: testDate1,
      startTime: '09:00',
      symptoms: 'Checkup',
    }),
  });
  const bookData = await bookRes.json();
  console.log(`Booking During Leave Status: ${bookRes.status} (Expected: 409), Message: "${bookData.message}"`);

  if (bookRes.status !== 409 || !bookData.message?.includes('leave')) {
    throw new Error('Test 3 Failed: System allowed patient booking on doctor leave date');
  }

  // --- TEST 4: LEAVE WITH EXISTING APPOINTMENTS ---
  console.log('\n--- TEST 4: LEAVE WITH EXISTING APPOINTMENTS (PREVIEW, CANCEL, NOTIFY) ---');
  // Create 2 confirmed appointments for testDate2
  const appt1 = await Appointment.create({
    patientId: patientA._id,
    doctorId: doctor._id,
    date: testDate2,
    startTime: '10:00',
    endTime: '10:30',
    status: 'confirmed',
    googleCalendarEventId: 'gcal_leave_test_123',
    symptoms: 'Cardio Follow-up',
  });

  const appt2 = await Appointment.create({
    patientId: patientA._id,
    doctorId: doctor._id,
    date: testDate2,
    startTime: '11:00',
    endTime: '11:30',
    status: 'confirmed',
    symptoms: 'Blood Pressure Check',
  });

  // Check preview
  const previewRes2 = await fetch(`${baseURL}/admin/doctors/${doctor._id}/leave-preview?date=${testDate2}`, {
    headers: { Cookie: adminCookie },
  });
  const previewData2 = await previewRes2.json();
  console.log(`Preview Found Affected Appointments: ${previewData2.data?.affectedCount} (Expected: 2)`);

  if (previewData2.data?.affectedCount !== 2) {
    throw new Error('Test 4 Failed: Leave preview did not identify 2 affected appointments');
  }

  // Admin marks doctor unavailable on testDate2
  const leaveRes2 = await fetch(`${baseURL}/admin/doctors/${doctor._id}/leaves`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ date: testDate2, reason: 'Medical Emergency' }),
  });
  const leaveData2 = await leaveRes2.json();
  console.log(`Marked Unavailable Status: ${leaveRes2.status}, Affected: ${leaveData2.data?.affectedCount}`);

  // Verify appointments were updated to 'cancelled'
  const checkAppt1 = await Appointment.findById(appt1._id);
  const checkAppt2 = await Appointment.findById(appt2._id);
  console.log(`Appt 1 Status in DB: ${checkAppt1.status} (Expected: cancelled)`);
  console.log(`Appt 2 Status in DB: ${checkAppt2.status} (Expected: cancelled)`);
  console.log(`Appt 1 Google Calendar Event Cleared: ${checkAppt1.googleCalendarEventId === ''}`);

  if (checkAppt1.status !== 'cancelled' || checkAppt2.status !== 'cancelled') {
    throw new Error('Test 4 Failed: Affected appointments were not cancelled');
  }

  // --- TEST 5: REMOVING LEAVE (RESTORES WORKING SLOTS) ---
  console.log('\n--- TEST 5: REMOVING LEAVE RESTORES AVAILABILITY ---');
  const deleteLeaveRes = await fetch(`${baseURL}/admin/doctors/${doctor._id}/leaves/${leaveData1.data?.leave?._id}`, {
    method: 'DELETE',
    headers: { Cookie: adminCookie },
  });
  const deleteLeaveData = await deleteLeaveRes.json();
  console.log(`Delete Leave Status: ${deleteLeaveRes.status}, Message: "${deleteLeaveData.message}"`);

  // Check availability on testDate1 (should no longer be on leave)
  const availRes = await fetch(`${baseURL}/doctors/${doctor._id}/availability?date=${testDate1}`);
  const availData = await availRes.json();
  console.log(`Availability after removing leave: isOnLeave = ${availData.data?.isOnLeave} (Expected: false)`);

  if (availData.data?.isOnLeave !== false) {
    throw new Error('Test 5 Failed: Removing leave did not restore slot availability');
  }

  // Clean test records
  await DoctorLeave.deleteMany({ doctorId: doctor._id, date: { $in: [testDate1, testDate2] } });
  await Appointment.deleteMany({ doctorId: doctor._id, date: { $in: [testDate1, testDate2] } });

  console.log('\nALL HARDENED DOCTOR LEAVE MANAGEMENT TESTS PASSED PERFECTLY!');
  process.exit(0);
}

testHardenedDoctorLeave().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
