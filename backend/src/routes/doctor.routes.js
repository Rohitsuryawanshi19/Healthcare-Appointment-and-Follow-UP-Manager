const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctor.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

// Strict RBAC protection: Only DOCTOR role can access
router.use(requireAuth, requireRole('doctor'));

// Doctor Dashboard Stats
router.get('/dashboard', doctorController.getDashboardStats);

// Appointments Management
router.get('/appointments', doctorController.getAppointments);
router.get('/appointments/:id', doctorController.getAppointmentById);
router.patch('/appointments/:id/status', doctorController.updateAppointmentStatus);
router.put('/appointments/:id/notes', doctorController.saveDoctorNotes);
router.post('/appointments/:id/prescription', doctorController.savePrescription);
router.post('/appointments/:id/consultation', doctorController.submitConsultation);

// Doctor Profile
router.get('/profile', doctorController.getProfile);
router.put('/profile', doctorController.updateProfile);

// Schedule & Leaves Management
router.get('/schedule', doctorController.getSchedule);
router.put('/schedule', doctorController.updateSchedule);
router.get('/leaves', doctorController.getSchedule);
router.post('/leaves', doctorController.addLeave);
router.delete('/leaves/:id', doctorController.deleteLeave);

module.exports = router;
