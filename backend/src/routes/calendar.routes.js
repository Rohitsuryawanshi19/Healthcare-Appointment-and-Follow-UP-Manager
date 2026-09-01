const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendar.controller');
const { requireAuth } = require('../middleware/auth.middleware');

// Public callback endpoint hit by Google redirect
router.get('/callback', calendarController.handleGoogleCallback);

// Authenticated Google Calendar operations
router.use(requireAuth);

router.get('/connect', calendarController.connectGoogleCalendar);
router.get('/status', calendarController.getCalendarStatus);
router.post('/disconnect', calendarController.disconnectGoogleCalendar);
router.post('/sync/:appointmentId', calendarController.retrySyncAppointment);

module.exports = router;
