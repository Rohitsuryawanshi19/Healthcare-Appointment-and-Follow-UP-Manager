const mongoose = require('mongoose');
require('dotenv').config();

async function testAiChatEndpoint() {
  console.log('=== STARTING INTERACTIVE AI CHAT STREAMING TEST ===\n');

  const baseURL = 'http://localhost:5000/api';

  // 1. Authenticate Patient
  const loginRes = await fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'patient.a@demo.com', password: 'DemoPassword123!' }),
  });
  const cookie = loginRes.headers.get('set-cookie');

  // --- TEST 1: STREAMING CHAT REQUEST ---
  console.log('--- TEST 1: SSE STREAMING CHAT ---');
  const chatRes = await fetch(`${baseURL}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      message: 'I have had a mild persistent headache and eye strain for 2 days.',
      history: [],
    }),
  });

  console.log('Status:', chatRes.status);
  console.log('Content-Type:', chatRes.headers.get('content-type'));

  if (chatRes.status !== 200 || !chatRes.headers.get('content-type')?.includes('text/event-stream')) {
    throw new Error('Test 1 Failed: SSE streaming headers not set properly');
  }

  const reader = chatRes.body.getReader();
  const decoder = new TextDecoder();
  let receivedChunks = 0;
  let fullResponse = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const text = decoder.decode(value);
    receivedChunks++;
    fullResponse += text;
  }

  console.log(`Received ${receivedChunks} streaming chunks.`);
  console.log('Sample Stream Output:', fullResponse.substring(0, 300).replace(/\n/g, ' '));

  // --- TEST 2: GUARDRAIL - EMPTY MESSAGE VALIDATION ---
  console.log('\n--- TEST 2: GUARDRAILS (EMPTY MESSAGE) ---');
  const emptyRes = await fetch(`${baseURL}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ message: '   ' }),
  });
  const emptyData = await emptyRes.json();
  console.log('Status:', emptyRes.status, 'Message:', emptyData.message);

  if (emptyRes.status !== 400) {
    throw new Error('Test 2 Failed: Empty message was not blocked with 400');
  }

  // --- TEST 3: GUARDRAIL - OVERSIZED MESSAGE (>2000 CHARS) ---
  console.log('\n--- TEST 3: GUARDRAILS (MESSAGE OVER 2000 CHARS) ---');
  const oversizedMsg = 'a'.repeat(2500);
  const overRes = await fetch(`${baseURL}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ message: oversizedMsg }),
  });
  const overData = await overRes.json();
  console.log('Status:', overRes.status, 'Message:', overData.message);

  if (overRes.status !== 400) {
    throw new Error('Test 3 Failed: Oversized message was not blocked with 400');
  }

  console.log('\n=== ALL AI CHAT STREAMING TESTS PASSED PERFECTLY! ===');
  process.exit(0);
}

testAiChatEndpoint().catch((err) => {
  console.error('Chat test failed:', err);
  process.exit(1);
});
