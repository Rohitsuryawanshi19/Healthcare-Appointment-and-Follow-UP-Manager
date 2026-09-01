const mongoose = require('mongoose');
require('dotenv').config();

const { User, Doctor, Appointment, Prescription, Notification } = require('../models');
const {
  generateRemindersForPrescription,
  processDueReminders,
  getNextReminderTime,
  parseDurationInDays,
} = require('../services/medicationReminderService');

async function testPrescriptionAndReminders() {
  console.log('=== STARTING PRESCRIPTION MANAGEMENT & REMINDER JOBS TEST SUITE ===\n');

  const connUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/careflow';
  await mongoose.connect(connUri);

  const baseURL = 'http://localhost:5000/api';

  const patientA = await User.findOne({ email: 'patient.a@demo.com' });
  const doctor = await Doctor.findOne({ verificationStatus: 'verified' }).populate('userId');

  // Authenticate Patient A
  const patientLogin = await fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'patient.a@demo.com', password: 'DemoPassword123!' }),
  });
  const patientCookie = patientLogin.headers.get('set-cookie');

  // 1. Create a dummy test appointment
  const testDate = '2026-10-25';
  const testSlot = '16:00';
  await Appointment.deleteMany({ doctorId: doctor._id, date: testDate, startTime: testSlot });

  const appt = await Appointment.create({
    patientId: patientA._id,
    doctorId: doctor._id,
    date: testDate,
    startTime: testSlot,
    endTime: '16:30',
    status: 'completed',
    symptoms: 'Post-operative recovery review.',
  });

  // Clean old notifications for test
  await Notification.deleteMany({ userId: patientA._id, type: 'medication_reminder' });
  await Prescription.deleteMany({ appointmentId: appt._id });

  // --- TEST 1: PRESCRIPTION CREATION (STORED SEPARATELY) ---
  console.log('--- TEST 1: PRESCRIPTION CREATION WITH DIVERSE FREQUENCIES ---');
  const rx = await Prescription.create({
    appointmentId: appt._id,
    patientId: patientA._id,
    doctorId: doctor._id,
    medicines: [
      {
        name: 'Amoxicillin',
        dosage: '500mg',
        frequency: 'Three times daily',
        duration: '5 days',
        timing: 'after_meal',
        instructions: 'Take with food.',
      },
      {
        name: 'Pantoprazole',
        dosage: '40mg',
        frequency: 'Once daily',
        duration: '7 days',
        timing: 'before_meal',
        instructions: 'Take 30 mins before breakfast.',
      },
      {
        name: 'Tramadol-Paracetamol',
        dosage: '37.5mg/325mg',
        frequency: 'Every 8 hours',
        duration: '3 days',
        timing: 'after_meal',
        instructions: 'For severe pain.',
      },
      {
        name: 'Cetirizine',
        dosage: '10mg',
        frequency: 'As needed',
        duration: '10 days',
        timing: 'bedtime',
        instructions: 'Take if allergic itching occurs.',
      },
    ],
    instructions: 'Complete full antibacterial course.',
  });

  console.log(`Created Prescription ID: ${rx._id}`);
  console.log(`Medicines Count: ${rx.medicines.length}`);

  if (rx.medicines.length !== 4) {
    throw new Error('Test 1 Failed: Prescription medicines not created');
  }

  // --- TEST 2: REMINDER GENERATION ---
  console.log('\n--- TEST 2: MEDICATION REMINDER SCHEDULE GENERATION ---');
  const genResult = await generateRemindersForPrescription(rx._id);
  console.log(`Scheduled Initial Reminders: ${genResult.scheduledCount}`);

  const initialNotificationCount = await Notification.countDocuments({
    prescriptionId: rx._id,
    type: 'medication_reminder',
  });
  console.log(`Notification records created in MongoDB: ${initialNotificationCount}`);

  if (initialNotificationCount === 0) {
    throw new Error('Test 2 Failed: No notification records were generated for prescription');
  }

  // --- TEST 3: DUPLICATE PREVENTION ---
  console.log('\n--- TEST 3: DUPLICATE REMINDER PREVENTION (IDEMPOTENCY) ---');
  // Re-run generation twice consecutively
  await generateRemindersForPrescription(rx._id);
  await generateRemindersForPrescription(rx._id);

  const afterDuplicateCheckCount = await Notification.countDocuments({
    prescriptionId: rx._id,
    type: 'medication_reminder',
  });
  console.log(`Notification count after rerun: ${afterDuplicateCheckCount} (Expected: exactly ${initialNotificationCount})`);

  if (afterDuplicateCheckCount !== initialNotificationCount) {
    throw new Error('Test 3 Failed: Duplicate reminder notifications were created on rerun');
  }

  // --- TEST 4: DUE REMINDER PROCESSING ---
  console.log('\n--- TEST 4: PROCESSING DUE REMINDERS ---');
  // Simulate time advancing 10 days into future
  const simulatedFuture = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
  const processResult = await processDueReminders(simulatedFuture);
  console.log(`Processed Due Reminders: ${processResult.processedCount}`);

  const sentCount = await Notification.countDocuments({
    prescriptionId: rx._id,
    status: 'sent',
  });
  console.log(`Delivered Sent Notifications in DB: ${sentCount}`);

  if (sentCount === 0) {
    throw new Error('Test 4 Failed: Due reminders were not marked as sent');
  }

  // --- TEST 5: COMPLETED PRESCRIPTION RECOGNITION ---
  console.log('\n--- TEST 5: COMPLETED PRESCRIPTION RECOGNITION ---');
  const oldStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  const nextRemForOld = getNextReminderTime(rx.medicines[0], oldStartDate, new Date());
  console.log(`Next reminder for expired 5-day prescription from 30 days ago: ${nextRemForOld} (Expected: null)`);

  if (nextRemForOld !== null) {
    throw new Error('Test 5 Failed: Completed prescription still generated next reminder');
  }

  // --- TEST 6: PATIENT MEDICATIONS API (/api/patient/medications) ---
  console.log('\n--- TEST 6: PATIENT MEDICATIONS PAGE API INSPECTION ---');
  const medsRes = await fetch(`${baseURL}/patient/medications`, {
    headers: { Cookie: patientCookie },
  });
  const medsData = await medsRes.json();
  console.log(`API Status: ${medsRes.status}`);
  console.log(`Formatted Medications Count: ${medsData.data?.medications?.length}`);
  console.log(`Recent Reminders Count: ${medsData.data?.recentReminders?.length}`);

  const firstMed = medsData.data?.medications?.[0];
  console.log('First Medicine Sample:');
  console.log('  Name:', firstMed?.name);
  console.log('  Dosage:', firstMed?.dosage);
  console.log('  Frequency:', firstMed?.frequency);
  console.log('  Duration:', firstMed?.duration);
  console.log('  Next Reminder:', firstMed?.nextReminder);
  console.log('  Doctor:', firstMed?.doctorName);

  if (!firstMed?.name || !firstMed?.dosage || !firstMed?.frequency) {
    throw new Error('Test 6 Failed: Medications API schema is incomplete');
  }

  // Cleanup test records
  await Appointment.deleteMany({ doctorId: doctor._id, date: testDate, startTime: testSlot });
  await Prescription.deleteMany({ appointmentId: appt._id });
  await Notification.deleteMany({ prescriptionId: rx._id });

  console.log('\nALL PRESCRIPTION & MEDICATION REMINDER TESTS PASSED PERFECTLY!');
  process.exit(0);
}

testPrescriptionAndReminders().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
