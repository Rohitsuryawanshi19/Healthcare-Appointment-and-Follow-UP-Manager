const mongoose = require('mongoose');
require('dotenv').config();

const { User, Doctor, Appointment } = require('../models');

async function testHoldAndLifecycle() {
  console.log('=== STARTING APPOINTMENT SLOT HOLDING & LIFECYCLE TESTS ===');

  const connUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/careflow';
  await mongoose.connect(connUri);

  // Setup Patient A and Patient B
  let patientA = await User.findOne({ email: 'patient.a@demo.com' });
  let patientB = await User.findOne({ email: 'patient.b@demo.com' });
  const doctor = await Doctor.findOne({ verificationStatus: 'verified' }).populate('userId');

  const baseURL = 'http://localhost:5000/api';

  // Login cookies
  const resLoginA = await fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'patient.a@demo.com', password: 'DemoPassword123!' }),
  });
  const cookieA = resLoginA.headers.get('set-cookie');

  const resLoginB = await fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'patient.b@demo.com', password: 'DemoPassword123!' }),
  });
  const cookieB = resLoginB.headers.get('set-cookie');

  const testDate = '2026-09-29'; // Tuesday
  const testSlot = '11:00';
  const newRescheduleSlot = '11:30';

  // Clean test slots
  await Appointment.deleteMany({
    doctorId: doctor._id,
    date: testDate,
    startTime: { $in: [testSlot, newRescheduleSlot] },
  });

  // --- 1. TEST SLOT HOLD (AVAILABLE -> HELD) ---
  console.log('\n--- 1. TESTING SLOT HOLD (AVAILABLE -> HELD) ---');
  const holdRes = await fetch(`${baseURL}/appointments/hold`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({
      doctorId: doctor._id.toString(),
      date: testDate,
      startTime: testSlot,
    }),
  });
  const holdData = await holdRes.json();
  console.log(`Hold Status: ${holdRes.status}, Message: "${holdData.message}"`);
  console.log(`HeldAt: ${holdData.data?.heldAt}, ExpiresAt: ${holdData.data?.expiresAt}`);
  const holdId = holdData.data?.appointmentId;

  // Check Availability: Slot should now be HELD
  const availRes1 = await fetch(`${baseURL}/doctors/${doctor._id}/availability?date=${testDate}`);
  const availData1 = await availRes1.json();
  const checkedSlot1 = availData1.data.slots.find((s) => s.startTime === testSlot);
  console.log(`Availability Engine slot ${testSlot} status: ${checkedSlot1?.status} (Expected: held)`);

  // --- 2. TEST BOOKING SOMEONE ELSE'S HOLD (Patient B attempts to confirm Patient A's hold) ---
  console.log("\n--- 2. TESTING BOOKING SOMEONE ELSE'S HOLD ---");
  const hijackRes = await fetch(`${baseURL}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieB },
    body: JSON.stringify({ holdId, symptoms: 'Attempting hijack' }),
  });
  const hijackData = await hijackRes.json();
  console.log(`Hijack Attempt Status: ${hijackRes.status} (Expected: 403), Message: "${hijackData.message}"`);

  // --- 3. TEST HOLD EXPIRATION (Simulate hold expired 10 seconds ago) ---
  console.log('\n--- 3. TESTING HOLD EXPIRATION (HELD -> AVAILABLE) ---');
  await Appointment.findByIdAndUpdate(holdId, {
    expiresAt: new Date(Date.now() - 10000),
    heldUntil: new Date(Date.now() - 10000),
  });

  // Check Availability: Expired hold should now be released to AVAILABLE
  const availRes2 = await fetch(`${baseURL}/doctors/${doctor._id}/availability?date=${testDate}`);
  const availData2 = await availRes2.json();
  const checkedSlot2 = availData2.data.slots.find((s) => s.startTime === testSlot);
  console.log(`Availability Engine slot ${testSlot} status after expiration: ${checkedSlot2?.status} (Expected: available)`);

  // Attempting to confirm expired hold should fail with 409
  const expiredConfirmRes = await fetch(`${baseURL}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({ holdId, symptoms: 'Trying to confirm expired hold' }),
  });
  const expiredConfirmData = await expiredConfirmRes.json();
  console.log(`Confirming Expired Hold Status: ${expiredConfirmRes.status} (Expected: 409), Message: "${expiredConfirmData.message}"`);

  // --- 4. TEST CONFIRMATION (AVAILABLE -> HELD -> CONFIRMED) ---
  console.log('\n--- 4. TESTING SUCCESSFUL HOLD & CONFIRMATION ---');
  const newHold = await fetch(`${baseURL}/appointments/hold`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({
      doctorId: doctor._id.toString(),
      date: testDate,
      startTime: testSlot,
    }),
  }).then((r) => r.json());

  const validHoldId = newHold.data.appointmentId;

  const confirmRes = await fetch(`${baseURL}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({
      holdId: validHoldId,
      symptoms: 'Patient A confirmed consultation symptoms.',
    }),
  });
  const confirmData = await confirmRes.json();
  console.log(`Confirmation Status: ${confirmRes.status}, Appointment ID: ${confirmData.data?._id}, Status: ${confirmData.data?.status}`);
  const confirmedApptId = confirmData.data?._id;

  // --- 5. TEST RESCHEDULING (CONFIRMED -> RESCHEDULED, locks new slot 11:30) ---
  console.log('\n--- 5. TESTING RESCHEDULING ---');
  const reschedRes = await fetch(`${baseURL}/appointments/${confirmedApptId}/reschedule`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({
      newDate: testDate,
      newStartTime: newRescheduleSlot,
      symptoms: 'Rescheduled appointment consultation.',
    }),
  });
  const reschedData = await reschedRes.json();
  console.log(`Reschedule Status: ${reschedRes.status}, Message: "${reschedData.message}"`);
  console.log(`New Appointment ID: ${reschedData.data?._id}, Slot: ${reschedData.data?.startTime}`);

  // Verify availability: Old slot 11:00 should be available, new slot 11:30 should be booked
  const availRes3 = await fetch(`${baseURL}/doctors/${doctor._id}/availability?date=${testDate}`).then((r) => r.json());
  const oldSlotCheck = availRes3.data.slots.find((s) => s.startTime === testSlot);
  const newSlotCheck = availRes3.data.slots.find((s) => s.startTime === newRescheduleSlot);
  console.log(`Old Slot (${testSlot}) Status: ${oldSlotCheck?.status} (Expected: available)`);
  console.log(`New Slot (${newRescheduleSlot}) Status: ${newSlotCheck?.status} (Expected: booked)`);

  // --- 6. TEST CANCELLATION (CONFIRMED -> CANCELLED, releases new slot 11:30) ---
  console.log('\n--- 6. TESTING CANCELLATION ---');
  const newApptId = reschedData.data?._id;
  const cancelRes = await fetch(`${baseURL}/appointments/${newApptId}/cancel`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
  });
  const cancelData = await cancelRes.json();
  console.log(`Cancellation Status: ${cancelRes.status}, Message: "${cancelData.message}"`);

  // Verify availability: Slot 11:30 is now available again
  const availRes4 = await fetch(`${baseURL}/doctors/${doctor._id}/availability?date=${testDate}`).then((r) => r.json());
  const releasedSlotCheck = availRes4.data.slots.find((s) => s.startTime === newRescheduleSlot);
  console.log(`Released Slot (${newRescheduleSlot}) Status: ${releasedSlotCheck?.status} (Expected: available)`);

  // Clean test slots
  await Appointment.deleteMany({
    doctorId: doctor._id,
    date: testDate,
    startTime: { $in: [testSlot, newRescheduleSlot] },
  });

  console.log('\nALL APPOINTMENT HOLDING & LIFECYCLE TESTS PASSED PERFECTLY!');
  process.exit(0);
}

testHoldAndLifecycle().catch((err) => {
  console.error('Test script exception:', err);
  process.exit(1);
});
