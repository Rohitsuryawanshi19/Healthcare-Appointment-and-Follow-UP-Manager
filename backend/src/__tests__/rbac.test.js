const request = require('supertest');
const app = require('../index');
const { User, Doctor } = require('../models');

describe('Role-Based Access Control (RBAC) Security Suite', () => {
  let patientCookie, doctorCookie, adminCookie;
  let doctorUser, doctorProfile;

  beforeEach(async () => {
    // 1. Patient User
    await User.create({
      name: 'Patient User',
      email: 'patient.rbac@test.com',
      password: 'Password123!',
      role: 'patient',
    });
    const patientLogin = await request(app).post('/api/auth/login').send({
      email: 'patient.rbac@test.com',
      password: 'Password123!',
    });
    patientCookie = patientLogin.headers['set-cookie'];

    // 2. Doctor User & Profile
    doctorUser = await User.create({
      name: 'Doctor User',
      email: 'doctor.rbac@test.com',
      password: 'Password123!',
      role: 'doctor',
    });
    doctorProfile = await Doctor.create({
      userId: doctorUser._id,
      specialization: 'Cardiology',
      qualification: 'MBBS, MD',
      registrationNumber: 'MCI-RBAC-' + Date.now(),
      registrationCouncil: 'State Medical Council',
      experience: 10,
      consultationFee: 500,
      verificationStatus: 'verified',
    });
    const doctorLogin = await request(app).post('/api/auth/login').send({
      email: 'doctor.rbac@test.com',
      password: 'Password123!',
    });
    doctorCookie = doctorLogin.headers['set-cookie'];

    // 3. Admin User
    await User.create({
      name: 'Admin User',
      email: 'admin.rbac@test.com',
      password: 'Password123!',
      role: 'admin',
    });
    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin.rbac@test.com',
      password: 'Password123!',
    });
    adminCookie = adminLogin.headers['set-cookie'];
  });

  describe('Unauthenticated Access', () => {
    it('should block unauthenticated requests to /api/admin/stats with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/admin/stats');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should block unauthenticated requests to /api/doctor/dashboard with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/doctor/dashboard');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Patient Role Authorization Limits', () => {
    it('should block patient from /api/admin/stats with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Cookie', patientCookie);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Forbidden/i);
    });

    it('should block patient from /api/doctor/dashboard with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/doctor/dashboard')
        .set('Cookie', patientCookie);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Forbidden/i);
    });
  });

  describe('Doctor Role Authorization Limits', () => {
    it('should block doctor from /api/admin/stats with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Cookie', doctorCookie);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow doctor to access /api/doctor/dashboard with 200 OK', async () => {
      const res = await request(app)
        .get('/api/doctor/dashboard')
        .set('Cookie', doctorCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Admin Role Authorization Permissions', () => {
    it('should allow admin to access /api/admin/stats with 200 OK', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it('should allow admin to access /api/admin/users with 200 OK', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
