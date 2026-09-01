const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patient.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

// Protect patient endpoints strictly to PATIENT or ADMIN role
router.use(requireAuth, requireRole('patient', 'admin'));

// Patient Dashboard & Doctors Directory
router.get('/dashboard', patientController.getDashboard);
router.get('/doctors', patientController.getDoctors);
router.get('/doctors/:id', patientController.getDoctorById);

// Patient Appointments & Medications
router.get('/appointments', patientController.getAppointments);
router.get('/appointments/:id', patientController.getAppointmentById);
router.get('/medications', patientController.getMedications);

// Patient Profile
router.get('/profile', patientController.getProfile);
router.put('/profile', patientController.updateProfile);

module.exports = router;
