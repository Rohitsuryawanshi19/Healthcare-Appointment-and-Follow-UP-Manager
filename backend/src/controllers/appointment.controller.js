const mongoose = require('mongoose');
const { Appointment, Doctor, User, DoctorLeave } = require('../models');
const {
  calculateDoctorAvailability,
  isValidDateString,
  timeToMinutes,
  minutesToTime,
  cleanupExpiredHolds,
} = require('../services/availabilityService');
const { generatePreVisitSummary, DISCLAIMER_TEXT } = require('../services/aiService');
const {
  sendBookingConfirmation,
  sendCancellationEmail,
  sendRescheduleEmail,
} = require('../services/emailService');
const {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} = require('../services/calendarService');
const { emitNotification } = require('../services/socketService');

const HOLD_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// @desc    Hold a slot for 5 minutes during patient checkout
// @route   POST /api/appointments/hold
// @access  Private (Patient or Admin)
exports.holdSlot = async (req, res, next) => {
  try {
    const { doctorId, date, startTime } = req.body;

    if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ success: false, message: 'Valid Doctor ID is required.' });
    }

    if (!date || !isValidDateString(date)) {
      return res.status(400).json({ success: false, message: 'Valid date (YYYY-MM-DD) is required.' });
    }

    if (!startTime || !/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/.test(startTime)) {
      return res.status(400).json({ success: false, message: 'Valid start time (HH:mm) is required.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (date < todayStr) {
      return res.status(400).json({ success: false, message: 'Cannot hold slots in the past.' });
    }

    const doctor = await Doctor.findById(doctorId).populate('userId', 'name email');
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    if (doctor.verificationStatus !== 'verified') {
      return res.status(400).json({ success: false, message: 'Doctor is not verified for consultation bookings.' });
    }

    // Clean up system-wide expired holds first
    await cleanupExpiredHolds();

    // Check if slot is currently active or held
    const existingActive = await Appointment.findOne({
      doctorId: doctor._id,
      date,
      startTime,
      status: { $in: ['confirmed', 'held', 'pending', 'completed'] },
    });

    const now = new Date();

    if (existingActive) {
      // If it's already confirmed or completed
      if (['confirmed', 'completed'].includes(existingActive.status)) {
        return res.status(409).json({
          success: false,
          message: 'Sorry, this slot was just booked by another patient.',
        });
      }

      // If it is held
      if (existingActive.status === 'held') {
        const expiration = existingActive.expiresAt || existingActive.heldUntil;
        if (expiration && new Date(expiration) > now) {
          // If held by the SAME patient, refresh their 5-minute timer
          if (String(existingActive.patientId) === String(req.user._id)) {
            existingActive.heldAt = now;
            existingActive.expiresAt = new Date(now.getTime() + HOLD_DURATION_MS);
            existingActive.heldUntil = existingActive.expiresAt;
            await existingActive.save();

            return res.status(200).json({
              success: true,
              message: 'Slot hold refreshed for 5 minutes.',
              data: {
                appointmentId: existingActive._id,
                doctorId: doctor._id,
                date,
                startTime,
                endTime: existingActive.endTime,
                status: 'held',
                heldAt: existingActive.heldAt,
                expiresAt: existingActive.expiresAt,
                remainingSeconds: 300,
              },
            });
          }

          // Held by someone else
          return res.status(409).json({
            success: false,
            message: 'Sorry, this slot was just booked by another patient.',
          });
        } else {
          // Expired hold -> release it
          existingActive.status = 'cancelled';
          await existingActive.save();
        }
      }
    }

    // Validate via Availability Engine
    const availability = await calculateDoctorAvailability(doctorId, date, now);

    if (availability.isOnLeave) {
      return res.status(409).json({
        success: false,
        message: `Doctor is on scheduled leave on ${date}: ${availability.leaveReason || 'Not available'}`,
      });
    }

    if (!availability.isWorkingDay) {
      return res.status(400).json({
        success: false,
        message: `Doctor does not have consultation hours on ${availability.dayOfWeek}s.`,
      });
    }

    const matchingSlot = availability.slots?.find((s) => s.startTime === startTime);
    if (!matchingSlot || matchingSlot.status === 'unavailable') {
      return res.status(400).json({
        success: false,
        message: `Time slot ${startTime} is unavailable for consultation.`,
      });
    }

    // Calculate end time
    const slotDuration = doctor.slotDuration || 30;
    const startMins = timeToMinutes(startTime);
    const endTime = minutesToTime(startMins + slotDuration);

    const heldAt = now;
    const expiresAt = new Date(now.getTime() + HOLD_DURATION_MS);

    // Cancel any other active hold this patient might have open
    await Appointment.updateMany(
      { patientId: req.user._id, status: 'held' },
      { status: 'cancelled' }
    );

    // Create HELD appointment with DB concurrency unique lock
    const holdAppt = await Appointment.create({
      patientId: req.user._id,
      doctorId: doctor._id,
      date,
      startTime,
      endTime,
      status: 'held',
      heldAt,
      expiresAt,
      heldUntil: expiresAt,
      heldBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Slot successfully held for 5 minutes.',
      data: {
        appointmentId: holdAppt._id,
        doctorId: doctor._id,
        date,
        startTime,
        endTime,
        status: 'held',
        heldAt,
        expiresAt,
        remainingSeconds: 300,
      },
    });
  } catch (error) {
    if (error.code === 11000 || error.name === 'MongoServerError') {
      return res.status(409).json({
        success: false,
        message: 'Sorry, this slot was just booked by another patient.',
      });
    }
    next(error);
  }
};

// @desc    Release / Cancel a held slot
// @route   POST /api/appointments/:id/release-hold
// @access  Private (Patient or Admin)
exports.releaseHold = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      status: 'held',
      patientId: req.user._id,
    });

    if (appointment) {
      appointment.status = 'cancelled';
      await appointment.save();
    }

    res.status(200).json({
      success: true,
      message: 'Slot hold released.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm booking (Transition HELD -> CONFIRMED or direct booking)
// @route   POST /api/appointments
// @access  Private (Patient or Admin)
exports.createAppointment = async (req, res, next) => {
  try {
    const { holdId, appointmentId, heldAppointmentId, doctorId, date, startTime, symptoms, status = 'confirmed' } = req.body;
    const targetHoldId = holdId || appointmentId || heldAppointmentId;
    const now = new Date();

    // Generate AI pre-visit summary if symptoms provided
    let aiSummaryObj = {
      chiefComplaint: '',
      triageUrgency: 'Low',
      suggestedQuestions: [],
      disclaimer: DISCLAIMER_TEXT,
      status: 'pending',
    };

    if (symptoms && symptoms.trim() !== '') {
      const generated = await generatePreVisitSummary(symptoms);
      aiSummaryObj = {
        chiefComplaint: generated.chiefComplaint,
        triageUrgency: generated.urgency,
        suggestedQuestions: generated.suggestedQuestions,
        disclaimer: generated.disclaimer || DISCLAIMER_TEXT,
        status: generated.status || 'completed',
        generatedAt: new Date(),
      };
    }

    // 1. If confirming an existing HELD appointment
    if (targetHoldId && mongoose.Types.ObjectId.isValid(targetHoldId)) {
      const heldAppt = await Appointment.findById(targetHoldId);

      if (!heldAppt) {
        return res.status(404).json({ success: false, message: 'Held appointment reservation not found.' });
      }

      // Security check: Prevent booking someone else's hold
      if (String(heldAppt.patientId) !== String(req.user._id) && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: Cannot confirm a slot reserved by another patient.',
        });
      }

      // Check if hold has expired (HELD -> AVAILABLE transition)
      const expiration = heldAppt.expiresAt || heldAppt.heldUntil;
      if (heldAppt.status !== 'held' || (expiration && new Date(expiration) <= now)) {
        heldAppt.status = 'cancelled';
        await heldAppt.save();
        return res.status(409).json({
          success: false,
          message: 'Sorry, your 5-minute hold has expired. Please select the slot again.',
        });
      }

      // Transition HELD -> CONFIRMED
      heldAppt.status = 'confirmed';
      heldAppt.symptoms = symptoms ? symptoms.trim() : '';
      heldAppt.aiSummary = aiSummaryObj;
      heldAppt.expiresAt = null;
      heldAppt.heldUntil = null;
      await heldAppt.save();

      const populated = await Appointment.findById(heldAppt._id)
        .populate('patientId', 'name email phone')
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email phone' } });

      // Non-blocking transactional email notification
      sendBookingConfirmation({
        appointment: populated,
        patient: populated.patientId,
        doctor: populated.doctorId,
      }).catch((e) => console.warn('Email dispatch non-fatal error:', e.message));

      // Non-blocking Google Calendar event creation
      createCalendarEvent({
        appointment: populated,
        patient: populated.patientId,
        doctor: populated.doctorId,
      }).catch((e) => console.warn('Google Calendar sync non-fatal error:', e.message));

      return res.status(201).json({
        success: true,
        message: 'Appointment confirmed successfully.',
        data: populated,
      });
    }

    // 2. Direct booking path without pre-hold
    if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ success: false, message: 'Valid Doctor ID is required.' });
    }

    if (!date || !isValidDateString(date)) {
      return res.status(400).json({ success: false, message: 'Valid date (YYYY-MM-DD) is required.' });
    }

    if (!startTime || !/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/.test(startTime)) {
      return res.status(400).json({ success: false, message: 'Valid start time (HH:mm) is required.' });
    }

    const todayStr = now.toISOString().split('T')[0];
    if (date < todayStr) {
      return res.status(400).json({ success: false, message: 'Cannot book appointments in the past.' });
    }

    const doctor = await Doctor.findById(doctorId).populate('userId', 'name email phone');
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    if (doctor.verificationStatus !== 'verified') {
      return res.status(400).json({ success: false, message: 'Consultations can only be booked with verified medical specialists.' });
    }

    // Clean up expired holds
    await cleanupExpiredHolds();

    // Availability validation
    const availability = await calculateDoctorAvailability(doctorId, date, now);

    if (availability.isOnLeave) {
      return res.status(409).json({
        success: false,
        message: `Doctor is on scheduled leave on ${date}: ${availability.leaveReason || 'Not available'}`,
      });
    }

    if (!availability.isWorkingDay) {
      return res.status(400).json({
        success: false,
        message: `Doctor does not have consultation hours on ${availability.dayOfWeek}s.`,
      });
    }

    const matchingSlot = availability.slots?.find((s) => s.startTime === startTime);
    if (!matchingSlot) {
      return res.status(400).json({
        success: false,
        message: `Time slot ${startTime} is not a valid consultation window for this doctor.`,
      });
    }

    if (matchingSlot.status === 'booked') {
      return res.status(409).json({
        success: false,
        message: 'Sorry, this slot was just booked by another patient.',
      });
    }

    if (matchingSlot.status === 'held') {
      return res.status(409).json({
        success: false,
        message: 'Sorry, this slot was just booked by another patient.',
      });
    }

    if (matchingSlot.status === 'unavailable') {
      return res.status(400).json({
        success: false,
        message: `Time slot ${startTime} is unavailable or in the past.`,
      });
    }

    const slotDuration = doctor.slotDuration || 30;
    const startMins = timeToMinutes(startTime);
    const endTime = minutesToTime(startMins + slotDuration);

    const appointment = await Appointment.create({
      patientId: req.user._id,
      doctorId: doctor._id,
      date,
      startTime,
      endTime,
      status: 'confirmed',
      symptoms: symptoms ? symptoms.trim() : '',
      aiSummary: aiSummaryObj,
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'name email phone')
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name email phone' },
      });

    // Non-blocking transactional email notification
    sendBookingConfirmation({
      appointment: populatedAppointment,
      patient: populatedAppointment.patientId,
      doctor: populatedAppointment.doctorId,
    }).catch((e) => console.warn('Email dispatch non-fatal error:', e.message));

    // Non-blocking Google Calendar event creation
    createCalendarEvent({
      appointment: populatedAppointment,
      patient: populatedAppointment.patientId,
      doctor: populatedAppointment.doctorId,
    }).catch((e) => console.warn('Google Calendar sync non-fatal error:', e.message));

    // Live Socket.IO notification emission
    if (populatedAppointment.patientId?._id) {
      emitNotification(populatedAppointment.patientId._id, {
        type: 'appointment_confirmed',
        title: 'Appointment Confirmed',
        message: `Your consultation with ${populatedAppointment.doctorId?.userId?.name || 'Doctor'} on ${date} at ${startTime} is confirmed.`,
        appointmentId: populatedAppointment._id,
      });
    }
    if (populatedAppointment.doctorId?.userId?._id) {
      emitNotification(populatedAppointment.doctorId.userId._id, {
        type: 'appointment_confirmed',
        title: 'New Appointment Booked',
        message: `New booking with ${populatedAppointment.patientId?.name || 'Patient'} on ${date} at ${startTime}.`,
        appointmentId: populatedAppointment._id,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully.',
      data: populatedAppointment,
    });
  } catch (error) {
    if (error.code === 11000 || error.name === 'MongoServerError') {
      return res.status(409).json({
        success: false,
        message: 'Sorry, this slot was just booked by another patient.',
      });
    }
    next(error);
  }
};

// @desc    Cancel an appointment (CONFIRMED -> CANCELLED, releases slot)
// @route   PATCH /api/appointments/:id/cancel
// @access  Private (Patient, Doctor, or Admin)
exports.cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'name email')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email' } });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    const isPatient = String(appointment.patientId?._id) === String(req.user._id);
    const isDoctor = String(appointment.doctorId?.userId?._id) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized to cancel this appointment.' });
    }

    const eventIdToDelete = appointment.googleCalendarEventId;

    appointment.status = 'cancelled';
    appointment.googleCalendarEventId = '';
    appointment.googleCalendarSyncStatus = 'none';
    await appointment.save();

    // Non-blocking transactional cancellation email
    sendCancellationEmail({
      appointment,
      patient: appointment.patientId,
      doctor: appointment.doctorId,
      cancelledBy: req.user.name,
    }).catch((e) => console.warn('Cancellation email dispatch non-fatal error:', e.message));

    // Non-blocking Google Calendar event deletion
    if (eventIdToDelete) {
      deleteCalendarEvent({
        appointmentId: appointment._id,
        googleCalendarEventId: eventIdToDelete,
      }).catch((e) => console.warn('Calendar delete event non-fatal error:', e.message));
    }

    // Live Socket.IO notification emission
    if (appointment.patientId?._id) {
      emitNotification(appointment.patientId._id, {
        type: 'appointment_cancelled',
        title: 'Appointment Cancelled',
        message: `Consultation on ${appointment.date} at ${appointment.startTime} was cancelled by ${req.user.name}.`,
        appointmentId: appointment._id,
      });
    }
    if (appointment.doctorId?.userId?._id) {
      emitNotification(appointment.doctorId.userId._id, {
        type: 'appointment_cancelled',
        title: 'Appointment Cancelled',
        message: `Consultation with ${appointment.patientId?.name || 'Patient'} on ${appointment.date} at ${appointment.startTime} was cancelled.`,
        appointmentId: appointment._id,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully. Time slot is now open.',
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reschedule appointment (CONFIRMED -> RESCHEDULED, validates and locks new slot)
// @route   PATCH /api/appointments/:id/reschedule
// @access  Private (Patient or Admin)
exports.rescheduleAppointment = async (req, res, next) => {
  try {
    const { newDate, newStartTime, symptoms } = req.body;

    if (!newDate || !isValidDateString(newDate)) {
      return res.status(400).json({ success: false, message: 'Valid new date (YYYY-MM-DD) is required.' });
    }

    if (!newStartTime || !/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/.test(newStartTime)) {
      return res.status(400).json({ success: false, message: 'Valid new start time (HH:mm) is required.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (newDate < todayStr) {
      return res.status(400).json({ success: false, message: 'Cannot reschedule to a past date.' });
    }

    const oldAppointment = await Appointment.findById(req.params.id);
    if (!oldAppointment) {
      return res.status(404).json({ success: false, message: 'Original appointment not found.' });
    }

    const isPatient = String(oldAppointment.patientId) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized to reschedule this appointment.' });
    }

    const doctor = await Doctor.findById(oldAppointment.doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    // Validate new slot via Availability Engine
    const availability = await calculateDoctorAvailability(doctor._id, newDate, new Date());

    if (availability.isOnLeave) {
      return res.status(409).json({
        success: false,
        message: `Doctor is on scheduled leave on ${newDate}: ${availability.leaveReason || 'Not available'}`,
      });
    }

    if (!availability.isWorkingDay) {
      return res.status(400).json({
        success: false,
        message: `Doctor does not have consultation hours on ${availability.dayOfWeek}s.`,
      });
    }

    const matchingSlot = availability.slots?.find((s) => s.startTime === newStartTime);
    if (!matchingSlot || matchingSlot.status !== 'available') {
      return res.status(409).json({
        success: false,
        message: `Selected new slot ${newStartTime} on ${newDate} is not available.`,
      });
    }

    const slotDuration = doctor.slotDuration || 30;
    const startMins = timeToMinutes(newStartTime);
    const newEndTime = minutesToTime(startMins + slotDuration);

    // Release old appointment (CONFIRMED -> RESCHEDULED)
    oldAppointment.status = 'rescheduled';
    await oldAppointment.save();

    // Create new confirmed appointment for the new slot
    const newAppointment = await Appointment.create({
      patientId: oldAppointment.patientId,
      doctorId: doctor._id,
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      status: 'confirmed',
      symptoms: symptoms ? symptoms.trim() : oldAppointment.symptoms,
      aiSummary: oldAppointment.aiSummary,
    });

    const populated = await Appointment.findById(newAppointment._id)
      .populate('patientId', 'name email phone')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email phone' } });

    // Non-blocking transactional reschedule email
    sendRescheduleEmail({
      oldAppointment,
      newAppointment: populated,
      patient: populated.patientId,
      doctor: populated.doctorId,
    }).catch((e) => console.warn('Reschedule email dispatch non-fatal error:', e.message));

    // Non-blocking Google Calendar event update
    if (oldAppointment.googleCalendarEventId) {
      updateCalendarEvent({
        appointmentId: newAppointment._id,
        googleCalendarEventId: oldAppointment.googleCalendarEventId,
        newDate,
        newStartTime,
        newEndTime,
      }).catch((e) => console.warn('Calendar update event non-fatal error:', e.message));
    }

    // Live Socket.IO notification emission
    if (populated.patientId?._id) {
      emitNotification(populated.patientId._id, {
        type: 'appointment_rescheduled',
        title: 'Appointment Rescheduled',
        message: `Consultation rescheduled to ${newDate} at ${newStartTime}.`,
        appointmentId: newAppointment._id,
      });
    }
    if (populated.doctorId?.userId?._id) {
      emitNotification(populated.doctorId.userId._id, {
        type: 'appointment_rescheduled',
        title: 'Appointment Rescheduled',
        message: `Consultation with ${populated.patientId?.name || 'Patient'} rescheduled to ${newDate} at ${newStartTime}.`,
        appointmentId: newAppointment._id,
      });
    }

    res.status(200).json({
      success: true,
      message: `Appointment successfully rescheduled to ${newDate} at ${newStartTime}.`,
      data: populated,
    });
  } catch (error) {
    if (error.code === 11000 || error.name === 'MongoServerError') {
      return res.status(409).json({
        success: false,
        message: 'Sorry, this slot was just booked by another patient.',
      });
    }
    next(error);
  }
};

// @desc    Get single appointment details
// @route   GET /api/appointments/:id
// @access  Private (Patient, Doctor, or Admin)
exports.getAppointmentById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid Appointment ID format.' });
    }

    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'name email phone')
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name email phone' },
      })
      .populate('prescriptionId');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    const isPatient = String(appointment.patientId?._id) === String(req.user._id);
    const isDoctor = String(appointment.doctorId?.userId?._id) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this appointment record.' });
    }

    res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};
