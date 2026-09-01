const express = require('express');
const router = express.Router();
const availabilityController = require('../controllers/availability.controller');

// GET /api/doctors/:doctorId/availability?date=YYYY-MM-DD
router.get('/:doctorId/availability', availabilityController.getDoctorAvailability);

module.exports = router;
