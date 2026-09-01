const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

// All appointment operations require authentication
router.use(requireAuth);

// 1. Hold a slot (5 minute reservation)
router.post('/hold', requireRole('patient', 'admin'), appointmentController.holdSlot);
router.post('/:id/release-hold', requireRole('patient', 'admin'), appointmentController.releaseHold);

// 2. Confirm booking (from hold or direct)
router.post('/', requireRole('patient', 'admin'), appointmentController.createAppointment);
router.post('/confirm', requireRole('patient', 'admin'), appointmentController.createAppointment);

// 3. Cancellation (CONFIRMED -> CANCELLED)
router.patch('/:id/cancel', appointmentController.cancelAppointment);

// 4. Rescheduling (CONFIRMED -> RESCHEDULED, locks new slot)
router.patch('/:id/reschedule', requireRole('patient', 'admin'), appointmentController.rescheduleAppointment);

// 5. Get appointment details
router.get('/:id', appointmentController.getAppointmentById);

module.exports = router;
