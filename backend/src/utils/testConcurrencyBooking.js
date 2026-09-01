const mongoose = require('mongoose');
require('dotenv').config();

const { User, Doctor, Appointment } = require('../models');

async function testConcurrency() {
  console.log('=== STARTING SIMULTANEOUS CONCURRENCY BOOKING TEST ===');

  const connUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/careflow';
  await mongoose.connect(connUri);

  // 1. Ensure 2 distinct patient accounts exist
  let patientA = await User.findOne({ email: 'patient.a@demo.com' });
  if (!patientA) {
    patientA = await User.create({
      name: 'Patient Alice',
      email: 'patient.a@demo.com',
      password: 'DemoPassword123!',
      phone: '+91 91111 00001',
      role: 'patient',
    });
  }

  let patientB = await User.findOne({ email: 'patient.b@demo.com' });
  if (!patientB) {
    patientB = await User.create({
      name: 'Patient Bob',
      email: 'patient.b@demo.com',
      password: 'DemoPassword123!',
      phone: '+91 91111 00002',
      role: 'patient',
    });
  }

  const doctor = await Doctor.findOne({ verificationStatus: 'verified' }).populate('userId');
  if (!doctor) {
    console.error('No verified doctor found in DB.');
    process.exit(1);
  }

  const testDate = '2026-09-15'; // Tuesday (Working day)
  const testSlot = '10:00';

  // Clean up any prior test appointment for this date/slot
  await Appointment.deleteMany({
    doctorId: doctor._id,
    date: testDate,
    startTime: testSlot,
  });

  console.log(`Target Doctor: ${doctor.userId?.name} (${doctor._id})`);
  console.log(`Target Slot: ${testDate} at ${testSlot}`);

  const baseURL = 'http://localhost:5000/api';

  // 2. Login Patient A and Patient B to obtain auth cookies
  const loginResA = await fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'patient.a@demo.com', password: 'DemoPassword123!' }),
  });
  const cookieA = loginResA.headers.get('set-cookie');

  const loginResB = await fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'patient.b@demo.com', password: 'DemoPassword123!' }),
  });
  const cookieB = loginResB.headers.get('set-cookie');

  console.log('Patient A & Patient B authenticated successfully.');

  // 3. Launch SIMULTANEOUS BOOKING REQUESTS via Promise.all
  console.log('Firing simultaneous booking requests for identical slot (10:00 on 2026-09-15)...');

  const bookingPayload = JSON.stringify({
    doctorId: doctor._id.toString(),
    date: testDate,
    startTime: testSlot,
    symptoms: 'Sudden onset palpitations during morning commute.',
  });

  const reqA = fetch(`${baseURL}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA || '' },
    body: bookingPayload,
  }).then(async (res) => ({ status: res.status, data: await res.json() }));

  const reqB = fetch(`${baseURL}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieB || '' },
    body: bookingPayload,
  }).then(async (res) => ({ status: res.status, data: await res.json() }));

  const [resA, resB] = await Promise.all([reqA, reqB]);

  let successCount = 0;
  let conflictCount = 0;

  if (resA.status === 201) {
    console.log(`Patient A: 201 CREATED -> "${resA.data.message}"`);
    successCount++;
  } else {
    console.log(`Patient A: ${resA.status} -> "${resA.data.message}"`);
    if (resA.status === 409) conflictCount++;
  }

  if (resB.status === 201) {
    console.log(`Patient B: 201 CREATED -> "${resB.data.message}"`);
    successCount++;
  } else {
    console.log(`Patient B: ${resB.status} -> "${resB.data.message}"`);
    if (resB.status === 409) conflictCount++;
  }

  console.log(`\n--- CONCURRENCY ANALYSIS ---`);
  console.log(`Successful Bookings: ${successCount} (Must be exactly 1)`);
  console.log(`Controlled Conflicts (409): ${conflictCount} (Must be exactly 1)`);

  // 4. Verify MongoDB DB state
  const dbCount = await Appointment.countDocuments({
    doctorId: doctor._id,
    date: testDate,
    startTime: testSlot,
    status: { $in: ['confirmed', 'held', 'pending'] },
  });

  console.log(`Database count for slot ${testDate} ${testSlot}: ${dbCount} (Must be exactly 1)`);

  // 5. Test Direct Mongoose Engine Concurrency Lock
  console.log('\n--- TESTING DIRECT DATABASE-LEVEL UNIQUE COMPOUND INDEX (E11000) ---');
  let dbLockPassed = false;
  try {
    await Promise.all([
      Appointment.create({
        patientId: patientA._id,
        doctorId: doctor._id,
        date: '2026-09-22',
        startTime: '14:00',
        endTime: '14:30',
        status: 'confirmed',
      }),
      Appointment.create({
        patientId: patientB._id,
        doctorId: doctor._id,
        date: '2026-09-22',
        startTime: '14:00',
        endTime: '14:30',
        status: 'confirmed',
      }),
    ]);
  } catch (err) {
    if (err.code === 11000) {
      dbLockPassed = true;
      console.log('Database Engine successfully triggered E11000 Unique Compound Index Lock!');
    } else {
      console.error('Unexpected error:', err);
    }
  }

  const directDbCount = await Appointment.countDocuments({
    doctorId: doctor._id,
    date: '2026-09-22',
    startTime: '14:00',
  });

  console.log(`Direct Database Records for 2026-09-22 14:00: ${directDbCount} (Must be exactly 1)`);

  // Clean up test slots
  await Appointment.deleteMany({
    doctorId: doctor._id,
    date: { $in: ['2026-09-15', '2026-09-22'] },
  });

  if (successCount === 1 && conflictCount === 1 && dbCount === 1 && dbLockPassed && directDbCount === 1) {
    console.log('\nALL SIMULTANEOUS CONCURRENCY TESTS PASSED PERFECTLY!');
    process.exit(0);
  } else {
    console.error('\nCONCURRENCY TEST FAILED!');
    process.exit(1);
  }
}

testConcurrency().catch((err) => {
  console.error('Test script exception:', err);
  process.exit(1);
});
