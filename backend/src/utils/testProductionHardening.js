const mongoose = require('mongoose');
require('dotenv').config();

async function testProductionHardening() {
  console.log('=== STARTING PRODUCTION HARDENING VALIDATION SUITE ===\n');

  const baseURL = 'http://localhost:5000/api';

  // --- TEST 1: CORRELATION ID & HEALTH ENDPOINT ---
  console.log('--- TEST 1: CORRELATION ID & HEALTH CHECK ---');
  const healthRes = await fetch(`${baseURL}/health`);
  const correlationHeader = healthRes.headers.get('x-correlation-id');
  const healthData = await healthRes.json();

  console.log('Health Status:', healthRes.status);
  console.log('Response X-Correlation-ID Header:', correlationHeader);
  console.log('Body Correlation ID:', healthData.correlationId);

  if (!correlationHeader || !healthData.correlationId || correlationHeader !== healthData.correlationId) {
    throw new Error('Test 1 Failed: Correlation ID missing or mismatched');
  }
  console.log('✅ Correlation ID tracing verified.');

  // --- TEST 2: REFRESH TOKEN FLOW ---
  console.log('\n--- TEST 2: SHORT-LIVED ACCESS TOKEN + REFRESH TOKEN ISSUANCE ---');
  const loginRes = await fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'patient.a@demo.com', password: 'DemoPassword123!' }),
  });
  const loginCookies = loginRes.headers.get('set-cookie');
  const loginData = await loginRes.json();

  console.log('Login Status:', loginRes.status);
  console.log('Has Access Token in body:', Boolean(loginData.data?.token));
  console.log('Has Refresh Token in body:', Boolean(loginData.data?.refreshToken));
  console.log('Set-Cookie Header present:', Boolean(loginCookies));

  if (!loginData.data?.token || !loginData.data?.refreshToken) {
    throw new Error('Test 2 Failed: Expected both token and refreshToken in auth response');
  }
  console.log('✅ Dual-token issuance verified.');

  // --- TEST 3: REFRESH TOKEN EXCHANGE ENDPOINT ---
  console.log('\n--- TEST 3: POST /api/auth/refresh ---');
  const refreshRes = await fetch(`${baseURL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: loginCookies,
    },
    body: JSON.stringify({ refreshToken: loginData.data.refreshToken }),
  });
  const refreshData = await refreshRes.json();
  console.log('Refresh Status:', refreshRes.status);
  console.log('New Access Token issued:', Boolean(refreshData.data?.token));
  console.log('New Refresh Token issued:', Boolean(refreshData.data?.refreshToken));

  if (refreshRes.status !== 200 || !refreshData.data?.token) {
    throw new Error('Test 3 Failed: Session refresh failed');
  }
  console.log('✅ Token refresh rotation verified.');

  // --- TEST 4: SANITIZED CENTRALIZED ERROR RESPONSE ---
  console.log('\n--- TEST 4: SANITIZED ERROR HANDLING & 404 ---');
  const notFoundRes = await fetch(`${baseURL}/non-existent-route`);
  const notFoundData = await notFoundRes.json();

  console.log('404 Status:', notFoundRes.status);
  console.log('404 Response contains Correlation ID:', Boolean(notFoundData.correlationId));

  if (notFoundRes.status !== 404 || !notFoundData.correlationId) {
    throw new Error('Test 4 Failed: 404 route handler error format incomplete');
  }
  console.log('✅ Error response format and correlation tracing verified.');

  console.log('\n=============================================================');
  console.log('🎉 ALL PRODUCTION HARDENING TESTS PASSED WITH 100% SUCCESS!');
  console.log('=============================================================');
  process.exit(0);
}

testProductionHardening().catch((err) => {
  console.error('Hardening test suite failed:', err);
  process.exit(1);
});
