const mongoose = require('mongoose');
require('dotenv').config();

const { User, Doctor, Appointment } = require('../models');
const { generatePreVisitSummary, generateHeuristicFallback, DISCLAIMER_TEXT } = require('../services/aiService');

async function testAiPreVisitSummary() {
  console.log('=== STARTING AI PRE-VISIT SYMPTOM SUMMARY TEST SUITE ===\n');

  const connUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/careflow';
  await mongoose.connect(connUri);

  const baseURL = 'http://localhost:5000/api';

  // 1. Authenticate Patient
  const loginRes = await fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'patient.a@demo.com', password: 'DemoPassword123!' }),
  });
  const cookie = loginRes.headers.get('set-cookie');

  const doctor = await Doctor.findOne({ verificationStatus: 'verified' }).populate('userId');

  // --- TEST 1: SUCCESSFUL AI REQUEST ---
  console.log('--- TEST 1: SUCCESSFUL AI PRE-VISIT REQUEST ---');
  const symptoms1 = 'Severe chest tightness and shortness of breath starting 2 hours ago during light exercise.';
  const res1 = await fetch(`${baseURL}/ai/pre-visit-summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ symptoms: symptoms1 }),
  });
  const data1 = await res1.json();
  console.log(`Status: ${res1.status}`);
  console.log('Urgency:', data1.data?.urgency);
  console.log('Chief Complaint:', data1.data?.chiefComplaint);
  console.log('Suggested Questions (Count:', data1.data?.suggestedQuestions?.length, '):', data1.data?.suggestedQuestions);
  console.log('Disclaimer:', data1.data?.disclaimer);

  if (!data1.data?.urgency || !data1.data?.chiefComplaint || data1.data?.suggestedQuestions?.length !== 3) {
    throw new Error('Test 1 Failed: Structured AI schema incomplete');
  }

  // --- TEST 2: MALFORMED AI RESPONSE (FALLBACK TEST) ---
  console.log('\n--- TEST 2: MALFORMED AI RESPONSE FALLBACK ---');
  const symptoms2 = 'Throbbing migraine headache behind right eye with photophobia and nausea for 3 days.';
  const res2 = await fetch(`${baseURL}/ai/pre-visit-summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ symptoms: symptoms2, mockMode: 'malformed' }),
  });
  const data2 = await res2.json();
  console.log(`Status: ${res2.status} (Graceful 200 returned)`);
  console.log('Urgency:', data2.data?.urgency);
  console.log('Chief Complaint:', data2.data?.chiefComplaint);
  console.log('Suggested Questions:', data2.data?.suggestedQuestions);
  console.log('Fallback Status:', data2.data?.status);

  if (!data2.data?.urgency || data2.data?.suggestedQuestions?.length !== 3) {
    throw new Error('Test 2 Failed: Malformed AI response did not recover with graceful fallback');
  }

  // --- TEST 3: API TIMEOUT TEST ---
  console.log('\n--- TEST 3: API TIMEOUT GRACEFUL RECOVERY ---');
  const res3 = await fetch(`${baseURL}/ai/pre-visit-summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ symptoms: 'Mild persistent dry cough in the morning.', mockMode: 'timeout' }),
  });
  const data3 = await res3.json();
  console.log(`Status: ${res3.status}`);
  console.log('Urgency:', data3.data?.urgency);
  console.log('Questions:', data3.data?.suggestedQuestions);

  if (!data3.data?.urgency) {
    throw new Error('Test 3 Failed: Timeout did not recover gracefully');
  }

  // --- TEST 4: MISSING API KEY FALLBACK VERIFICATION ---
  console.log('\n--- TEST 4: DIRECT HEURISTIC ENGINE (NO API KEY) ---');
  const heuristicResult = generateHeuristicFallback('Persistent high fever of 102F and erythematous skin rash on torso.');
  console.log('Urgency:', heuristicResult.urgency);
  console.log('Chief Complaint:', heuristicResult.chiefComplaint);
  console.log('Suggested Questions:', heuristicResult.suggestedQuestions);
  console.log('Disclaimer:', heuristicResult.disclaimer);

  if (heuristicResult.urgency !== 'Medium' || heuristicResult.suggestedQuestions.length !== 3) {
    throw new Error('Test 4 Failed: Heuristic triage engine validation failed');
  }

  // --- TEST 5: FULL APPOINTMENT CREATION WITH STORED AI SUMMARY ---
  console.log('\n--- TEST 5: APPOINTMENT CREATION WITH AUTOMATIC AI SUMMARY STORAGE ---');
  const testDate = '2026-10-06';
  const testSlot = '15:00';

  await Appointment.deleteMany({ doctorId: doctor._id, date: testDate, startTime: testSlot });

  const bookRes = await fetch(`${baseURL}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      doctorId: doctor._id.toString(),
      date: testDate,
      startTime: testSlot,
      symptoms: 'Recurring lower back stiffness and sciatica radiating to left knee after lifting heavy boxes.',
    }),
  });
  const bookData = await bookRes.json();
  console.log(`Booking Status: ${bookRes.status}`);
  const createdApptId = bookData.data?._id;

  const apptFromDb = await Appointment.findById(createdApptId);
  console.log('Stored AI Summary in DB:');
  console.log('  Triage Urgency:', apptFromDb.aiSummary?.triageUrgency);
  console.log('  Chief Complaint:', apptFromDb.aiSummary?.chiefComplaint);
  console.log('  Questions Count:', apptFromDb.aiSummary?.suggestedQuestions?.length);
  console.log('  Disclaimer:', apptFromDb.aiSummary?.disclaimer);

  if (!apptFromDb.aiSummary?.chiefComplaint || apptFromDb.aiSummary?.suggestedQuestions?.length !== 3) {
    throw new Error('Test 5 Failed: AI Summary was not automatically stored in appointment document');
  }

  // Clean test slot
  await Appointment.deleteMany({ doctorId: doctor._id, date: testDate, startTime: testSlot });

  console.log('\nALL AI PRE-VISIT SUMMARY TESTS PASSED PERFECTLY!');
  process.exit(0);
}

testAiPreVisitSummary().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
