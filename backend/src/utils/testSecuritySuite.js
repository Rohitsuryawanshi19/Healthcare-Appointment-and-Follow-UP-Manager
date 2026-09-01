const mongoose = require('mongoose');
require('dotenv').config();

const { User, Doctor, Appointment } = require('../models');

async function testSecuritySuite() {
  console.log('=== STARTING CAREFLOW COMPREHENSIVE SECURITY TEST SUITE ===\n');

  const connUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/careflow';
  await mongoose.connect(connUri);

  const baseURL = 'http://localhost:5000/api';

  // 1. Authenticate Patient A, Patient B, Doctor, and Admin
  const patientALogin = await fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'patient.a@demo.com', password: 'DemoPassword123!' }),
  });
  const patientACookie = patientALogin.headers.get('set-cookie');

  const patientBLogin = await fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'patient.b@demo.com', password: 'DemoPassword123!' }),
  });
  const patientBCookie = patientBLogin.headers.get('set-cookie');

  const docLogin = await fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'doctor@demo.com', password: 'DemoPassword123!' }),
  });
  const docCookie = docLogin.headers.get('set-cookie');

  const patientA = await User.findOne({ email: 'patient.a@demo.com' });
  const patientB = await User.findOne({ email: 'patient.b@demo.com' });
  const doctor = await Doctor.findOne({ verificationStatus: 'verified' }).populate('userId');

  // --- TEST 1: HELMET SECURITY HEADERS ---
  console.log('--- TEST 1: HELMET SECURITY HEADERS INSPECTION ---');
  const healthRes = await fetch(`${baseURL}/health`);
  const nosniff = healthRes.headers.get('x-content-type-options');
  const frameOptions = healthRes.headers.get('x-frame-options');
  const dnsPrefetch = healthRes.headers.get('x-dns-prefetch-control');

  console.log(`X-Content-Type-Options: ${nosniff} (Expected: nosniff)`);
  console.log(`X-Frame-Options: ${frameOptions} (Expected: SAMEORIGIN)`);
  console.log(`X-DNS-Prefetch-Control: ${dnsPrefetch} (Expected: off)`);

  if (nosniff !== 'nosniff' || frameOptions !== 'SAMEORIGIN') {
    throw new Error('Test 1 Failed: Helmet security headers missing or misconfigured');
  }

  // --- TEST 2: IDOR PROTECTION (CROSS-PATIENT APPOINTMENT LEAKAGE) ---
  console.log('\n--- TEST 2: IDOR ACCESS CONTROL (CROSS-PATIENT APPOINTMENT LEAKAGE) ---');
  const testDate = '2026-11-28';
  await Appointment.deleteMany({ doctorId: doctor._id, date: testDate });

  const apptPatientA = await Appointment.create({
    patientId: patientA._id,
    doctorId: doctor._id,
    date: testDate,
    startTime: '10:00',
    endTime: '10:30',
    status: 'confirmed',
    symptoms: 'Sensitive medical cardiology symptoms',
  });

  // Patient B tries to view Patient A's appointment details
  const idorRes = await fetch(`${baseURL}/patient/appointments/${apptPatientA._id}`, {
    headers: { Cookie: patientBCookie },
  });
  console.log(`Patient B accessing Patient A appointment status: ${idorRes.status} (Expected: 404 or 403)`);

  if (idorRes.status === 200) {
    throw new Error('Test 2 Failed: IDOR vulnerability detected! Patient B accessed Patient A record.');
  }

  // Patient B tries to cancel Patient A's appointment
  const idorCancelRes = await fetch(`${baseURL}/appointments/${apptPatientA._id}/cancel`, {
    method: 'PATCH',
    headers: { Cookie: patientBCookie },
  });
  console.log(`Patient B cancelling Patient A appointment status: ${idorCancelRes.status} (Expected: 403 Forbidden)`);

  if (idorCancelRes.status !== 403) {
    throw new Error('Test 2 Failed: Unauthorized patient was able to cancel another patient appointment.');
  }

  // --- TEST 3: ROLE ESCALATION PREVENTION ---
  console.log('\n--- TEST 3: ROLE ESCALATION PREVENTION ---');
  // Attempt to register with role: 'admin'
  const randomEmail = `hacker.${Date.now()}@demo.com`;
  const registerAttempt = await fetch(`${baseURL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Malicious User',
      email: randomEmail,
      password: 'HackerPassword123!',
      role: 'admin', // Escalation attempt
    }),
  });
  const regData = await registerAttempt.json();
  console.log(`Registration result role: ${regData.data?.user?.role} (Expected: patient)`);

  if (regData.data?.user?.role !== 'patient') {
    throw new Error('Test 3 Failed: User was able to escalate to admin during registration!');
  }

  // Clean up hacker test user
  await User.deleteOne({ email: randomEmail });

  // --- TEST 4: INVALID MONGODB OBJECTID HANDLING ---
  console.log('\n--- TEST 4: INVALID MONGODB OBJECTID (NO 500 CRASH / CLEAN 400) ---');
  const invalidIdRes = await fetch(`${baseURL}/patient/appointments/invalid-mongo-id-xyz`, {
    headers: { Cookie: patientACookie },
  });
  const invalidIdData = await invalidIdRes.json();
  console.log(`Invalid ID Status: ${invalidIdRes.status} (Expected: 400), Message: "${invalidIdData.message}"`);

  if (invalidIdRes.status !== 400) {
    throw new Error('Test 4 Failed: Invalid ObjectId was not caught with clean 400 Bad Request');
  }

  // --- TEST 5: MALFORMED JSON REQUEST HANDLING ---
  console.log('\n--- TEST 5: MALFORMED JSON BODY HANDLING ---');
  const malformedJsonRes = await fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"email": "broken_json_missing_brace',
  });
  const malformedJsonData = await malformedJsonRes.json();
  console.log(`Malformed JSON Status: ${malformedJsonRes.status} (Expected: 400), Message: "${malformedJsonData.message}"`);

  if (malformedJsonRes.status !== 400) {
    throw new Error('Test 5 Failed: Malformed JSON crashed server or did not return 400 Bad Request');
  }

  // --- TEST 6: SENSITIVE DATA LEAKAGE PREVENTION ---
  console.log('\n--- TEST 6: ZERO SENSITIVE DATA LEAKAGE INSPECTION ---');
  const meRes = await fetch(`${baseURL}/auth/me`, {
    headers: { Cookie: patientACookie },
  });
  const meText = await meRes.text();

  const hasPasswordHash = meText.includes('$2a$') || meText.includes('$2b$');
  const hasJwtSecret = meText.includes(process.env.JWT_SECRET || 'secret');
  const hasGoogleSecret = meText.includes(process.env.GOOGLE_CLIENT_SECRET || 'secret');

  console.log('Response contains password hash:', hasPasswordHash);
  console.log('Response contains JWT secret:', hasJwtSecret);
  console.log('Response contains Google secret:', hasGoogleSecret);

  if (hasPasswordHash || hasJwtSecret || hasGoogleSecret) {
    throw new Error('Test 6 Failed: Sensitive credential leakage detected in API responses!');
  }

  // Clean test appointment
  await Appointment.deleteMany({ doctorId: doctor._id, date: testDate });

  console.log('\nALL CAREFLOW SECURITY TESTS PASSED PERFECTLY!');
  process.exit(0);
}

testSecuritySuite().catch((err) => {
  console.error('Security Test Suite Failed:', err);
  process.exit(1);
});
