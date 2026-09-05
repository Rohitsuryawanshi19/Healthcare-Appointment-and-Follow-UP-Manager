const request = require('supertest');
const app = require('../index');
const { User, Doctor, Appointment } = require('../models');

describe('Appointment Booking & Concurrency Protection Suite', () => {
  let patientAUser, patientBUser, doctorUser, doctorProfile;
  let cookiePatientA, cookiePatientB;

  beforeEach(async () => {
    // 1. Create Patient A
    patientAUser = await User.create({
      name: 'Alice Patient',
      email: 'alice@test.com',
      password: 'Password123!',
      phone: '+91 90000 00001',
      role: 'patient',
    });
    const loginA = await request(app).post('/api/auth/login').send({
      email: 'alice@test.com',
      password: 'Password123!',
    });
    cookiePatientA = loginA.headers['set-cookie'];

    // 2. Create Patient B
    patientBUser = await User.create({
      name: 'Bob Patient',
      email: 'bob@test.com',
      password: 'Password123!',
      phone: '+91 90000 00002',
      role: 'patient',
    });
    const loginB = await request(app).post('/api/auth/login').send({
      email: 'bob@test.com',
      password: 'Password123!',
    });
    cookiePatientB = loginB.headers['set-cookie'];

    // 3. Create Doctor
    doctorUser = await User.create({
      name: 'Dr. Gregory House',
      email: 'dr.house@test.com',
      password: 'Password123!',
      role: 'doctor',
    });

    doctorProfile = await Doctor.create({
      userId: doctorUser._id,
      specialization: 'Internal Medicine',
      qualification: 'MBBS, MD',
      registrationNumber: 'MCI-APPT-' + Date.now(),
      registrationCouncil: 'State Medical Council',
      experience: 15,
      consultationFee: 750,
      verificationStatus: 'verified',
      workingHours: [
        { day: 'Monday', isAvailable: true, startTime: '09:00', endTime: '17:00' },
        { day: 'Tuesday', isAvailable: true, startTime: '09:00', endTime: '17:00' },
        { day: 'Wednesday', isAvailable: true, startTime: '09:00', endTime: '17:00' },
        { day: 'Thursday', isAvailable: true, startTime: '09:00', endTime: '17:00' },
        { day: 'Friday', isAvailable: true, startTime: '09:00', endTime: '17:00' },
      ],
      slotDuration: 30,
    });
  });

  describe('Direct Appointment Booking', () => {
    it('should successfully book an available slot', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .set('Cookie', cookiePatientA)
        .send({
          doctorId: doctorProfile._id.toString(),
          date: '2026-09-15',
          startTime: '10:00',
          symptoms: 'Routine checkup',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.status).toBe('confirmed');
    });

    it('should reject simultaneous double-booking on same slot with 409 Conflict', async () => {
      const bookingPayload = {
        doctorId: doctorProfile._id.toString(),
        date: '2026-09-15',
        startTime: '10:00',
        symptoms: 'Concurrent test',
      };

      const [resA, resB] = await Promise.all([
        request(app)
          .post('/api/appointments')
          .set('Cookie', cookiePatientA)
          .send(bookingPayload),
        request(app)
          .post('/api/appointments')
          .set('Cookie', cookiePatientB)
          .send(bookingPayload),
      ]);

      const statuses = [resA.status, resB.status];
      expect(statuses).toContain(201);
      expect(statuses).toContain(409);

      // Verify only 1 record exists in DB
      const count = await Appointment.countDocuments({
        doctorId: doctorProfile._id,
        date: '2026-09-15',
        startTime: '10:00',
        status: { $in: ['confirmed', 'held', 'pending'] },
      });
      expect(count).toBe(1);
    });
  });

  describe('Slot Hold & 5-Minute Expiry Lifecycle', () => {
    it('should place a 5-minute hold on an available slot', async () => {
      const res = await request(app)
        .post('/api/appointments/hold')
        .set('Cookie', cookiePatientA)
        .send({
          doctorId: doctorProfile._id.toString(),
          date: '2026-09-22',
          startTime: '11:00',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.appointmentId).toBeDefined();
      expect(res.body.data.expiresAt).toBeDefined();

      const holdDoc = await Appointment.findById(res.body.data.appointmentId);
      expect(holdDoc.status).toBe('held');
      expect(holdDoc.patientId.toString()).toBe(patientAUser._id.toString());
    });

    it('should prevent another patient from confirming someone elses hold with 403 Forbidden', async () => {
      // 1. Patient A places hold
      const holdRes = await request(app)
        .post('/api/appointments/hold')
        .set('Cookie', cookiePatientA)
        .send({
          doctorId: doctorProfile._id.toString(),
          date: '2026-09-22',
          startTime: '11:00',
        });
      const holdId = holdRes.body.data.appointmentId;

      // 2. Patient B tries to confirm holdId
      const hijackRes = await request(app)
        .post('/api/appointments')
        .set('Cookie', cookiePatientB)
        .send({
          holdId,
          symptoms: 'Hijack attempt',
        });

      expect(hijackRes.status).toBe(403);
      expect(hijackRes.body.success).toBe(false);
    });

    it('should reject booking when slot hold has expired', async () => {
      // 1. Patient A places hold
      const holdRes = await request(app)
        .post('/api/appointments/hold')
        .set('Cookie', cookiePatientA)
        .send({
          doctorId: doctorProfile._id.toString(),
          date: '2026-09-22',
          startTime: '11:00',
        });
      const holdId = holdRes.body.data.appointmentId;

      // 2. Manually expire hold in DB (simulate 5-minute timeout)
      await Appointment.findByIdAndUpdate(holdId, {
        expiresAt: new Date(Date.now() - 5000),
      });

      // 3. Patient A tries to confirm expired hold
      const confirmRes = await request(app)
        .post('/api/appointments')
        .set('Cookie', cookiePatientA)
        .send({
          holdId,
          symptoms: 'Late confirmation',
        });

      expect(confirmRes.status).toBe(409);
      expect(confirmRes.body.message).toMatch(/expired/i);
    });
  });
});
