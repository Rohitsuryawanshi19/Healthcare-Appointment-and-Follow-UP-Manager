const mongoose = require('mongoose');
require('dotenv').config();

const { User, Doctor, Appointment, Prescription } = require('../models');

async function testDoctorConsultationWorkflow() {
  console.log('=== STARTING DOCTOR CONSULTATION WORKFLOW TEST SUITE ===\n');

  const connUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/careflow';
  await mongoose.connect(connUri);

  const baseURL = 'http://localhost:5000/api';

  // 1. Authenticate Doctor, Patient A, and Patient B
  const docLogin = await fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'doctor@demo.com', password: 'DemoPassword123!' }),
  });
  const docCookie = docLogin.headers.get('set-cookie');

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

  const docUser = await User.findOne({ email: 'doctor@demo.com' });
  const doctor = await Doctor.findOne({ userId: docUser._id }).populate('userId');
  const patientA = await User.findOne({ email: 'patient.a@demo.com' });
  const patientB = await User.findOne({ email: 'patient.b@demo.com' });

  // 2. Create a test confirmed appointment for Patient A with Doctor
  const testDate = '2026-10-12';
  const testSlot = '10:30';

  await Appointment.deleteMany({ doctorId: doctor._id, date: testDate, startTime: testSlot });

  const appt = await Appointment.create({
    patientId: patientA._id,
    doctorId: doctor._id,
    date: testDate,
    startTime: testSlot,
    endTime: '11:00',
    status: 'confirmed',
    symptoms: 'Fever of 101F, sore throat, difficulty swallowing for 2 days.',
  });

  console.log(`Created Confirmed Appointment ID: ${appt._id} for Patient: ${patientA.name}`);

  // --- TEST 1: CONSULTATION VALIDATION (Empty notes & diagnosis) ---
  console.log('\n--- TEST 1: CONSULTATION VALIDATION (EMPTY OBSERVATIONS) ---');
  const emptyRes = await fetch(`${baseURL}/doctor/appointments/${appt._id}/consultation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: docCookie },
    body: JSON.stringify({ doctorNotes: '', diagnosis: '' }),
  });
  const emptyData = await emptyRes.json();
  console.log(`Empty Submission Status: ${emptyRes.status} (Expected: 400), Message: "${emptyData.message}"`);
  if (emptyRes.status !== 400) throw new Error('Test 1 Failed: Empty clinical notes should be rejected');

  // --- TEST 2: UNAUTHORIZED PATIENT SUBMISSION ATTEMPT ---
  console.log('\n--- TEST 2: PATIENT CANNOT MODIFY DOCTOR CONSULTATION NOTES ---');
  const patientAttemptRes = await fetch(`${baseURL}/doctor/appointments/${appt._id}/consultation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: patientACookie },
    body: JSON.stringify({
      diagnosis: 'Self diagnosis',
      doctorNotes: 'Tampered notes',
    }),
  });
  console.log(`Patient Attempt Status: ${patientAttemptRes.status} (Expected: 403 Forbidden)`);
  if (patientAttemptRes.status !== 403) throw new Error('Test 2 Failed: Patient was able to access doctor route');

  // --- TEST 3: VALID DOCTOR CONSULTATION SUBMISSION ---
  console.log('\n--- TEST 3: VALID DOCTOR CONSULTATION SUBMISSION ---');
  const consultationPayload = {
    diagnosis: 'Acute Streptococcal Pharyngitis with secondary mild dehydration',
    doctorNotes: 'Oropharynx shows bilateral tonsillar exudates with cervical lymphadenopathy. SpO2 99%, BP 118/76 mmHg. Hydration advised.',
    followUpInstructions: 'Return in 5 days for follow-up review. Complete full antibiotic course.',
    medicines: [
      {
        name: 'Amoxicillin-Clavulanate',
        dosage: '625mg',
        frequency: 'Twice daily',
        duration: '5 days',
        timing: 'after_meal',
        instructions: 'Take after food with water.',
      },
      {
        name: 'Paracetamol',
        dosage: '650mg',
        frequency: 'As needed (SOS)',
        duration: '3 days',
        timing: 'after_meal',
        instructions: 'For fever > 100F.',
      },
    ],
  };

  const consultRes = await fetch(`${baseURL}/doctor/appointments/${appt._id}/consultation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: docCookie },
    body: JSON.stringify(consultationPayload),
  });
  const consultData = await consultRes.json();
  console.log(`Consultation Submission Status: ${consultRes.status}, Message: "${consultData.message}"`);
  console.log(`Updated Appointment Status: ${consultData.data?.status} (Expected: completed)`);
  console.log(`Prescription Linked ID: ${consultData.data?.prescriptionId?._id}`);
  console.log(`Prescription Medicines Count: ${consultData.data?.prescriptionId?.medicines?.length}`);

  if (consultData.data?.status !== 'completed' || !consultData.data?.prescriptionId) {
    throw new Error('Test 3 Failed: Consultation did not transition to completed or link prescription');
  }

  // --- TEST 4: PATIENT ACCESS & EHR READ-ONLY INSPECTION ---
  console.log('\n--- TEST 4: PATIENT ACCESS & READ-ONLY VERIFICATION ---');
  const patientViewRes = await fetch(`${baseURL}/patient/appointments/${appt._id}`, {
    headers: { Cookie: patientACookie },
  });
  const patientViewData = await patientViewRes.json();
  console.log(`Patient Access Status: ${patientViewRes.status}`);
  console.log('Patient view received Diagnosis:', patientViewData.data?.diagnosis);
  console.log('Patient view received Doctor Notes:', patientViewData.data?.doctorNotes);
  console.log('Patient view received Medicines:', patientViewData.data?.prescriptionId?.medicines?.map((m) => m.name));

  if (!patientViewData.data?.diagnosis || !patientViewData.data?.doctorNotes) {
    throw new Error('Test 4 Failed: Patient could not view completed clinical notes and diagnosis');
  }

  // --- TEST 5: CROSS-PATIENT PRIVACY ISOLATION ---
  console.log("\n--- TEST 5: CROSS-PATIENT PRIVACY (PATIENT B CANNOT ACCESS PATIENT A'S EHR) ---");
  const privacyCheckRes = await fetch(`${baseURL}/patient/appointments/${appt._id}`, {
    headers: { Cookie: patientBCookie },
  });
  console.log(`Patient B Attempt on Patient A Appointment Status: ${privacyCheckRes.status} (Expected: 404 or 403)`);
  if (privacyCheckRes.status === 200) {
    throw new Error('Test 5 Failed: Cross-patient medical record leakage occurred!');
  }

  // Clean test slot
  await Appointment.deleteMany({ doctorId: doctor._id, date: testDate, startTime: testSlot });
  await Prescription.deleteMany({ appointmentId: appt._id });

  console.log('\nALL DOCTOR CONSULTATION WORKFLOW TESTS PASSED PERFECTLY!');
  process.exit(0);
}

testDoctorConsultationWorkflow().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
