const request = require('supertest');
const app = require('../index');
const User = require('../models/User.model');
const googleAuthService = require('../services/googleAuthService');

// Mock Google Auth Service for deterministic testing
jest.mock('../services/googleAuthService');

describe('Authentication & Authorization Suite', () => {
  const patientData = {
    name: 'Test Patient',
    email: 'test.patient@example.com',
    password: 'Password123!',
    phone: '+91 98765 43210',
    role: 'patient',
  };

  describe('POST /api/auth/register', () => {
    it('should register a new patient successfully and return auth cookies', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(patientData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(patientData.email);
      expect(res.body.data.user.role).toBe('patient');
      expect(res.body.data.user.password).toBeUndefined();
      expect(res.body.data.token).toBeDefined();

      // Check cookie header
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes('token='))).toBe(true);
    });

    it('should reject duplicate email registration with 409 Conflict', async () => {
      await request(app).post('/api/auth/register').send(patientData);

      const res = await request(app)
        .post('/api/auth/register')
        .send(patientData);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid password format (<6 chars)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...patientData, password: '123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(patientData);
    });

    it('should login with valid credentials and return access + refresh tokens', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: patientData.email, password: patientData.password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.email).toBe(patientData.email);
    });

    it('should reject invalid credentials with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: patientData.email, password: 'WrongPassword999!' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/google', () => {
    it('should create new patient user from valid Google ID token', async () => {
      googleAuthService.verifyGoogleIdToken.mockResolvedValueOnce({
        googleId: 'google_sub_123456',
        email: 'google.patient@example.com',
        name: 'Google User',
        avatarUrl: 'https://lh3.googleusercontent.com/a/test',
      });

      const res = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'valid_mock_google_id_token' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('google.patient@example.com');
      expect(res.body.data.user.role).toBe('patient');
      expect(res.body.data.user.authProvider).toBe('google');
      expect(res.body.data.user.avatarUrl).toBe('https://lh3.googleusercontent.com/a/test');
    });

    it('should link existing local account to Google provider', async () => {
      await request(app).post('/api/auth/register').send(patientData);

      googleAuthService.verifyGoogleIdToken.mockResolvedValueOnce({
        googleId: 'google_sub_789012',
        email: patientData.email,
        name: 'Updated Google Name',
        avatarUrl: 'https://lh3.googleusercontent.com/a/avatar2',
      });

      const res = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'valid_mock_token_for_existing' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(patientData.email);

      // Verify DB update
      const dbUser = await User.findOne({ email: patientData.email });
      expect(dbUser.googleId).toBe('google_sub_789012');
    });

    it('should reject invalid / malformed Google tokens with 401', async () => {
      googleAuthService.verifyGoogleIdToken.mockRejectedValueOnce(
        new Error('Invalid Google ID token signature')
      );

      const res = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'invalid_token' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh & POST /api/auth/logout', () => {
    it('should refresh access token using valid refresh token', async () => {
      const loginRes = await request(app).post('/api/auth/register').send(patientData);
      const refreshToken = loginRes.body.data.refreshToken;

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should clear cookies on logout', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
