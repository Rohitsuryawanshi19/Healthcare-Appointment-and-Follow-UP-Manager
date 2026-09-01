const mongoose = require('mongoose');
require('dotenv').config();

const { User, Doctor, Appointment, Notification, DoctorLeave } = require('../models');
const {
  sendBookingConfirmation,
  sendAppointmentReminder,
  sendCancellationEmail,
  sendDoctorLeaveNotification,
  sendRescheduleEmail,
  retryPendingAndFailedEmails,
} = require('../services/emailService');

async function testTransactionalEmails() {
  console.log('=== STARTING TRANSACTIONAL EMAIL NOTIFICATIONS TEST SUITE ===\n');

  const connUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/careflow';
  await mongoose.connect(connUri);

  const patient = await User.findOne({ email: 'patient.a@demo.com' });
  const doctor = await Doctor.findOne({ verificationStatus: 'verified' }).populate('userId');

  const testDate = '2026-11-05';
  const testSlot = '11:00';

  await Appointment.deleteMany({ doctorId: doctor._id, date: testDate });
  await Notification.deleteMany({ userId: { $in: [patient._id, doctor.userId._id] }, channel: 'email' });

  const appt = await Appointment.create({
    patientId: patient._id,
    doctorId: doctor._id,
    date: testDate,
    startTime: testSlot,
    endTime: '11:30',
    status: 'confirmed',
    symptoms: 'Routine cardiology wellness follow-up.',
  });

  // --- TEST 1: BOOKING CONFIRMATION (PATIENT & DOCTOR) ---
  console.log('--- TEST 1: BOOKING CONFIRMATION DISPATCH (TO PATIENT & DOCTOR) ---');
  const bookResults = await sendBookingConfirmation({
    appointment: appt,
    patient,
    doctor,
  });
  console.log(`Booking Emails Dispatched Count: ${bookResults.length}`);
  console.log('Patient Email Success:', bookResults[0]?.success);
  console.log('Doctor Email Success:', bookResults[1]?.success);

  if (bookResults.length !== 2 || !bookResults[0]?.success || !bookResults[1]?.success) {
    throw new Error('Test 1 Failed: Booking confirmation did not send to both patient and doctor');
  }

  // --- TEST 2: APPOINTMENT REMINDER & RESCHEDULE ---
  console.log('\n--- TEST 2: APPOINTMENT REMINDER & RESCHEDULE DISPATCH ---');
  const reminderRes = await sendAppointmentReminder({
    appointment: appt,
    patient,
    doctor,
  });
  console.log('Reminder Email Success:', reminderRes.success);

  const reschedResults = await sendRescheduleEmail({
    oldAppointment: appt,
    newAppointment: { ...appt.toObject(), date: '2026-11-06', startTime: '15:00' },
    patient,
    doctor,
  });
  console.log(`Reschedule Emails Dispatched Count: ${reschedResults.length}`);

  if (!reminderRes.success || reschedResults.length !== 2) {
    throw new Error('Test 2 Failed: Reminder or Reschedule email dispatch failed');
  }

  // --- TEST 3: CANCELLATION & DOCTOR LEAVE EMAILS ---
  console.log('\n--- TEST 3: CANCELLATION & DOCTOR LEAVE EMAILS ---');
  const cancelResults = await sendCancellationEmail({
    appointment: appt,
    patient,
    doctor,
    cancelledBy: 'Dr. Sarah Patel',
  });
  console.log(`Cancellation Emails Dispatched Count: ${cancelResults.length}`);

  const leaveResults = await sendDoctorLeaveNotification({
    leave: { date: testDate, reason: 'Annual Medical Conference' },
    doctor,
    affectedAppointments: [appt],
  });
  console.log(`Doctor Leave Emails Dispatched Count: ${leaveResults.length}`);

  if (cancelResults.length !== 2 || leaveResults.length !== 1) {
    throw new Error('Test 3 Failed: Cancellation or Leave notification failed');
  }

  // --- TEST 4: FAILED EMAIL PROVIDER (GRACEFUL RESILIENCY) ---
  console.log('\n--- TEST 4: FAILED EMAIL PROVIDER & ERROR INTERCEPTION ---');
  const failResult = await sendBookingConfirmation({
    appointment: appt,
    patient,
    doctor,
    options: { mockFailPatient: true },
  });
  console.log('Simulated Failed Dispatch Result:', failResult[0]);

  const failedNotif = await Notification.findById(failResult[0].notificationId);
  console.log(`Failed Notification Status in DB: ${failedNotif?.status} (Expected: failed)`);
  console.log(`Retry Count: ${failedNotif?.retryCount}`);

  if (failedNotif?.status !== 'failed' || failedNotif?.retryCount !== 1) {
    throw new Error('Test 4 Failed: Failed email was not tracked as status: failed with retry count');
  }

  // --- TEST 5: RETRY WORKER ---
  console.log('\n--- TEST 5: BACKGROUND EMAIL RETRY WORKER ---');
  const retryReport = await retryPendingAndFailedEmails();
  console.log(`Retried Emails: ${retryReport.retriedCount}, Succeeded: ${retryReport.succeededCount}`);

  const retriedNotif = await Notification.findById(failedNotif._id);
  console.log(`Notification Status after Retry: ${retriedNotif?.status} (Expected: sent)`);

  if (retriedNotif?.status !== 'sent') {
    throw new Error('Test 5 Failed: Retry worker did not recover failed email');
  }

  // Clean test records
  await Appointment.deleteMany({ doctorId: doctor._id, date: testDate });
  await Notification.deleteMany({ userId: { $in: [patient._id, doctor.userId._id] }, channel: 'email' });

  console.log('\nALL TRANSACTIONAL EMAIL TESTS PASSED PERFECTLY!');
  process.exit(0);
}

testTransactionalEmails().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
