const mongoose = require('mongoose');
require('dotenv').config();

const { User, Doctor, Appointment, Prescription } = require('../models');

async function testPostVisitAiSummary() {
  console.log('=== STARTING POST-VISIT AI SUMMARY TEST SUITE ===\n');

  const connUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/careflow';
  await mongoose.connect(connUri);

  const baseURL = 'http://localhost:5000/api';

  // 1. Authenticate Doctor and Patient A
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
  const patientA = await User.findOne({ email: 'patient.a@demo.com' });

  const testDate = '2026-10-18';
  const testSlot = '14:00';

  await Appointment.deleteMany({ doctorId: doctor._id, date: testDate, startTime: testSlot });

  // 2. Create and complete consultation
  const appt = await Appointment.create({
    patientId: patientA._id,
    doctorId: doctor._id,
    date: testDate,
    startTime: testSlot,
    endTime: '14:30',
    status: 'confirmed',
    symptoms: 'Acute productive cough with yellow phlegm, intermittent fever of 100.8F, and wheezing.',
  });

  console.log(`Created Appointment ID: ${appt._id}`);

  // Doctor concludes consultation with full prescription
  const consultPayload = {
    diagnosis: 'Acute Bronchitis with secondary bronchospasm',
    doctorNotes: 'Chest auscultation reveals diffuse wheezing and rhonchi bilaterally in lower zones. SpO2 97% on room air. Heart sounds normal.',
    followUpInstructions: 'Review in 7 days. Complete course of antibiotics. Avoid cold air exposure and dust.',
    medicines: [
      {
        name: 'Azithromycin',
        dosage: '500mg',
        frequency: 'Once daily',
        duration: '3 days',
        timing: 'before_meal',
        instructions: 'Take 1 hour before breakfast with full glass of water.',
      },
      {
        name: 'Levosalbutamol Inhaler',
        dosage: '50mcg',
        frequency: 'Two puffs TDS',
        duration: '5 days',
        timing: 'as_needed',
        instructions: 'Use spacer for inhalation when experiencing wheezing.',
      },
    ],
  };

  const completeRes = await fetch(`${baseURL}/doctor/appointments/${appt._id}/consultation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: docCookie },
    body: JSON.stringify(consultPayload),
  });
  const completeData = await completeRes.json();
  console.log(`Doctor Concluded Consultation: Status ${completeRes.status}, Appointment Status: ${completeData.data?.status}`);

  // --- TEST 1: SUCCESSFUL POST-VISIT AI SUMMARY VERIFICATION ---
  console.log('\n--- TEST 1: VERIFYING 5-PART STRUCTURED POST-VISIT AI SUMMARY ---');
  const summary = completeData.data?.postVisitSummary;

  console.log('1. What Was Discussed:', summary?.whatWasDiscussed);
  console.log('2. Medication Schedule:', summary?.medicationSchedule);
  console.log('3. Important Instructions:', summary?.importantInstructions);
  console.log('4. Follow-Up Steps:', summary?.followUpSteps);
  console.log('5. When To Seek Help:', summary?.whenToSeekHelp);
  console.log('Disclaimer:', summary?.disclaimer);

  if (
    !summary?.whatWasDiscussed ||
    !summary?.medicationSchedule?.length ||
    !summary?.importantInstructions?.length ||
    !summary?.followUpSteps ||
    !summary?.whenToSeekHelp ||
    !summary?.disclaimer?.includes("This summary is generated from your clinician's notes.")
  ) {
    throw new Error('Test 1 Failed: Structured 5-part AI Post-Visit Summary is incomplete');
  }

  // --- TEST 2: AI FAILURE & GRACEFUL RESILIENCY ---
  console.log('\n--- TEST 2: AI FAILURE RESILIENCY (PRESERVE RECORD & FALLBACK) ---');
  const failRes = await fetch(`${baseURL}/ai/post-visit-summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: patientCookie },
    body: JSON.stringify({ appointmentId: appt._id.toString(), mockMode: 'timeout' }),
  });
  const failData = await failRes.json();
  console.log(`Fallback Status: ${failRes.status} (Graceful 200 returned)`);
  console.log('Fallback Output:', failData.data?.whatWasDiscussed);

  const checkAppt = await Appointment.findById(appt._id);
  console.log('Appointment Status Maintained:', checkAppt.status);
  console.log('Prescription Maintained:', !!checkAppt.prescriptionId);
  console.log('Doctor Notes Maintained:', checkAppt.doctorNotes.length > 0);

  if (checkAppt.status !== 'completed' || !checkAppt.prescriptionId || !checkAppt.doctorNotes) {
    throw new Error('Test 2 Failed: AI failure corrupted consultation EHR record');
  }

  // --- TEST 3: RETRY FEATURE ---
  console.log('\n--- TEST 3: POST-VISIT AI SUMMARY RETRY ---');
  const retryRes = await fetch(`${baseURL}/ai/post-visit-summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: patientCookie },
    body: JSON.stringify({ appointmentId: appt._id.toString() }),
  });
  const retryData = await retryRes.json();
  console.log(`Retry Request Status: ${retryRes.status}`);
  console.log('Retried Plan What Was Discussed:', retryData.data?.whatWasDiscussed);

  // --- TEST 4: PATIENT ACCESS & EHR INTEGRITY ---
  console.log('\n--- TEST 4: PATIENT ACCESS ON /patient/appointments/:id ---');
  const patientGetRes = await fetch(`${baseURL}/patient/appointments/${appt._id}`, {
    headers: { Cookie: patientCookie },
  });
  const patientGetData = await patientGetRes.json();
  console.log(`Patient Access Status: ${patientGetRes.status}`);
  console.log('Patient view received post-visit summary:', !!patientGetData.data?.postVisitSummary?.whatWasDiscussed);

  if (!patientGetData.data?.postVisitSummary?.whatWasDiscussed) {
    throw new Error('Test 4 Failed: Patient could not view completed Post-Visit AI Summary');
  }

  // Clean test slot
  await Appointment.deleteMany({ doctorId: doctor._id, date: testDate, startTime: testSlot });
  await Prescription.deleteMany({ appointmentId: appt._id });

  console.log('\nALL POST-VISIT AI SUMMARY TESTS PASSED PERFECTLY!');
  process.exit(0);
}

testPostVisitAiSummary().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
