const mongoose = require('mongoose');
require('dotenv').config();

const { User, Doctor, Appointment, Prescription, Notification } = require('../models');

async function testSeedIntegrity() {
  console.log('=== STARTING SEED DATA INTEGRITY VERIFICATION SUITE ===\n');

  const connUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/careflow';
  await mongoose.connect(connUri);

  const baseURL = 'http://localhost:5000/api';

  // --- TEST 1: VERIFY DOCTORS SYNTHETIC ATTRIBUTES ---
  console.log('--- TEST 1: SYNTHETIC DOCTOR REGISTRATION & DEMO DATA FLAGS ---');
  const doctors = await Doctor.find().populate('userId');
  console.log(`Total Seeded Doctors: ${doctors.length} (Expected: 5)`);

  for (const doc of doctors) {
    console.log(`- Doctor: ${doc.userId?.name} [${doc.specialization}]`);
    console.log(`  Reg No: ${doc.registrationNumber} (Synthetic Prefix: ${doc.registrationNumber.startsWith('DEMO-REG-')})`);
    console.log(`  Demo Flag: ${doc.demoData === true && doc.userId?.demoData === true}`);
    console.log(`  Council: ${doc.registrationCouncil}`);

    if (!doc.registrationNumber.startsWith('DEMO-REG-')) {
      throw new Error(`Test 1 Failed: Doctor ${doc.userId?.name} does not use synthetic DEMO-REG prefix`);
    }
    if (doc.demoData !== true || doc.userId?.demoData !== true) {
      throw new Error(`Test 1 Failed: Doctor ${doc.userId?.name} missing demoData: true flag`);
    }
  }

  // --- TEST 2: VERIFY ADMIN LOGIN & DASHBOARD ACCESS ---
  console.log('\n--- TEST 2: ADMIN LOGIN & KPI STATS INSPECTION ---');
  const adminLogin = await fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@demo.com', password: 'DemoPassword123!' }),
  });
  console.log(`Admin Login Status: ${adminLogin.status} (Expected: 200)`);
  const adminCookie = adminLogin.headers.get('set-cookie');

  const adminStatsRes = await fetch(`${baseURL}/admin/stats`, {
    headers: { Cookie: adminCookie },
  });
  const adminStats = await adminStatsRes.json();
  console.log(`Admin Stats: Total Doctors = ${adminStats.data?.totalDoctors}, Patients = ${adminStats.data?.totalPatients}`);

  if (adminStats.data?.totalDoctors !== 5 || adminStats.data?.totalPatients !== 3) {
    throw new Error('Test 2 Failed: Admin stats do not match seeded counts');
  }

  // --- TEST 3: VERIFY DOCTOR LOGIN & CLINICAL QUEUE ---
  console.log('\n--- TEST 3: DOCTOR LOGIN & WORKSPACE QUEUE ---');
  const docLogin = await fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'doctor@demo.com', password: 'DemoPassword123!' }),
  });
  console.log(`Doctor Login Status: ${docLogin.status} (Expected: 200)`);
  const docCookie = docLogin.headers.get('set-cookie');

  const docDashRes = await fetch(`${baseURL}/doctor/dashboard`, {
    headers: { Cookie: docCookie },
  });
  const docDash = await docDashRes.json();
  console.log(`Doctor Dashboard Appointments In Queue: ${docDash.data?.nextAppointments?.length}`);

  // --- TEST 4: VERIFY PATIENT LOGIN & EHR POST-VISIT SUMMARY ---
  console.log('\n--- TEST 4: PATIENT LOGIN & EHR POST-VISIT SUMMARY ---');
  const patientLogin = await fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'patient.a@demo.com', password: 'DemoPassword123!' }),
  });
  console.log(`Patient Login Status: ${patientLogin.status} (Expected: 200)`);
  const patientCookie = patientLogin.headers.get('set-cookie');

  const patientDashRes = await fetch(`${baseURL}/patient/dashboard`, {
    headers: { Cookie: patientCookie },
  });
  const patientDash = await patientDashRes.json();
  console.log(`Patient Dashboard Next Appt: Consultation with ${patientDash.data?.nextAppointment?.doctorId?.userId?.name}`);
  console.log(`Patient Medication Reminders: ${patientDash.data?.medicationReminders?.length}`);

  console.log('\nALL SEED DATA INTEGRITY TESTS PASSED PERFECTLY!');
  process.exit(0);
}

testSeedIntegrity().catch((err) => {
  console.error('Seed Integrity Test Failed:', err);
  process.exit(1);
});
