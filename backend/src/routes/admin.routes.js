const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

// Protect all admin routes strictly to ADMIN role
router.use(requireAuth, requireRole('admin'));

// Admin Dashboard KPI Stats
router.get('/stats', adminController.getDashboardStats);

// Doctor Management Endpoints
router.get('/doctors', adminController.getDoctors);
router.post('/doctors', adminController.createDoctor);
router.get('/doctors/:id', adminController.getDoctorById);
router.put('/doctors/:id', adminController.updateDoctor);
router.patch('/doctors/:id/status', adminController.updateDoctorVerification);

// Doctor Leave & Availability Management
router.get('/doctors/:id/leave-preview', adminController.getDoctorLeavePreview);
router.get('/doctors/:id/leaves', adminController.getDoctorLeaves);
router.post('/doctors/:id/leaves', adminController.addDoctorLeave);
router.delete('/doctors/:id/leaves/:leaveId', adminController.removeDoctorLeave);

// Appointments & Users Overview
router.get('/appointments', adminController.getAppointments);
router.get('/users', adminController.getUsers);

module.exports = router;
