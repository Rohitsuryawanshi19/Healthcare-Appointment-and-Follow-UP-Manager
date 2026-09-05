const { Doctor, User, Appointment, Prescription, DoctorLeave } = require('../models');
const { generatePostVisitSummary } = require('../services/aiService');
const { sendDoctorLeaveNotification } = require('../services/emailService');
const { invalidateCachePattern } = require('../services/cacheService');

// Helper to get doctor profile for logged-in user
const getDoctorForUser = async (userId) => {
  const doctor = await Doctor.findOne({ userId });
  if (!doctor) {
    const error = new Error('Doctor profile not found for this account.');
    error.status = 404;
    throw error;
  }
  return doctor;
};

// @desc    Get Doctor Dashboard Summary Stats
// @route   GET /api/doctor/dashboard
// @access  Private (Doctor only)
exports.getDashboardStats = async (req, res, next) => {
  try {
    const doctor = await getDoctorForUser(req.user._id);
    const todayStr = new Date().toISOString().split('T')[0];

    const [todayAppointments, upcomingAppointments, completedAppointments, cancelledAppointments, nextAppointments] =
      await Promise.all([
        Appointment.countDocuments({
          doctorId: doctor._id,
          date: todayStr,
          status: { $in: ['confirmed', 'pending', 'held'] },
        }),
        Appointment.countDocuments({
          doctorId: doctor._id,
          date: { $gte: todayStr },
          status: { $in: ['confirmed', 'pending', 'held'] },
        }),
        Appointment.countDocuments({
          doctorId: doctor._id,
          status: 'completed',
        }),
        Appointment.countDocuments({
          doctorId: doctor._id,
          status: 'cancelled',
        }),
        Appointment.find({
          doctorId: doctor._id,
          date: { $gte: todayStr },
          status: { $in: ['confirmed', 'pending', 'held'] },
        })
          .populate('patientId', 'name email phone')
          .sort({ date: 1, startTime: 1 })
          .limit(5),
      ]);

    res.status(200).json({
      success: true,
      data: {
        todayAppointments,
        upcomingAppointments,
        completedAppointments,
        cancelledAppointments,
        nextAppointments,
        doctor: {
          id: doctor._id,
          name: req.user.name,
          specialization: doctor.specialization,
          verificationStatus: doctor.verificationStatus,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Doctor Appointments with filters & pagination
// @route   GET /api/doctor/appointments
// @access  Private (Doctor only)
exports.getAppointments = async (req, res, next) => {
  try {
    const doctor = await getDoctorForUser(req.user._id);
    const { status, date, filter } = req.query;
    const query = { doctorId: doctor._id };
    const todayStr = new Date().toISOString().split('T')[0];

    if (status && status !== 'all') {
      query.status = status;
    }

    if (date) {
      query.date = date;
    } else if (filter === 'today') {
      query.date = todayStr;
    } else if (filter === 'upcoming') {
      query.date = { $gte: todayStr };
      if (!status) query.status = { $in: ['confirmed', 'pending', 'held'] };
    } else if (filter === 'past') {
      query.date = { $lt: todayStr };
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const total = await Appointment.countDocuments(query);
    const totalPages = Math.ceil(total / limit) || 1;

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email phone')
      .populate('prescriptionId')
      .sort({ date: -1, startTime: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: appointments.length,
      total,
      page,
      totalPages,
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Single Appointment Details
// @route   GET /api/doctor/appointments/:id
// @access  Private (Doctor only)
exports.getAppointmentById = async (req, res, next) => {
  try {
    const doctor = await getDoctorForUser(req.user._id);
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      doctorId: doctor._id,
    })
      .populate('patientId', 'name email phone createdAt')
      .populate('prescriptionId');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or not assigned to this doctor.',
      });
    }

    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Appointment Status (Completed, Cancelled)
// @route   PATCH /api/doctor/appointments/:id/status
// @access  Private (Doctor only)
exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const doctor = await getDoctorForUser(req.user._id);
    const { status } = req.body;

    if (!['confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be confirmed, completed, or cancelled.',
      });
    }

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      doctorId: doctor._id,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.',
      });
    }

    appointment.status = status;
    await appointment.save();

    res.status(200).json({
      success: true,
      message: `Appointment status updated to ${status}.`,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save Doctor Clinical Notes
// @route   PUT /api/doctor/appointments/:id/notes
// @access  Private (Doctor only)
exports.saveDoctorNotes = async (req, res, next) => {
  try {
    const doctor = await getDoctorForUser(req.user._id);
    const { doctorNotes } = req.body;

    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, doctorId: doctor._id },
      { doctorNotes: doctorNotes || '' },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Clinical notes saved successfully.',
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or Update Prescription for an Appointment
// @route   POST /api/doctor/appointments/:id/prescription
// @access  Private (Doctor only)
exports.savePrescription = async (req, res, next) => {
  try {
    const doctor = await getDoctorForUser(req.user._id);
    const { medicines, instructions } = req.body;

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      doctorId: doctor._id,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.',
      });
    }

    if (!Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Prescription must contain at least one medicine item.',
      });
    }

    let prescription;
    if (appointment.prescriptionId) {
      prescription = await Prescription.findByIdAndUpdate(
        appointment.prescriptionId,
        {
          medicines,
          instructions: instructions || '',
        },
        { new: true }
      );
    } else {
      prescription = await Prescription.create({
        appointmentId: appointment._id,
        patientId: appointment.patientId,
        doctorId: doctor._id,
        medicines,
        instructions: instructions || '',
      });
      appointment.prescriptionId = prescription._id;
      await appointment.save();
    }

    res.status(200).json({
      success: true,
      message: 'Prescription saved successfully.',
      data: prescription,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit Complete Doctor Consultation (Clinical Notes, Diagnosis, Prescription, Follow-Up)
// @route   POST /api/doctor/appointments/:id/consultation
// @access  Private (Doctor only)
exports.submitConsultation = async (req, res, next) => {
  try {
    const doctor = await getDoctorForUser(req.user._id);
    const { doctorNotes, diagnosis, medicines, followUpInstructions } = req.body;

    // 1. Validate Appointment existence and doctor authorization
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      doctorId: doctor._id,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or not assigned to this doctor.',
      });
    }

    // 2. Validate mandatory clinical observations
    if ((!doctorNotes || !doctorNotes.trim()) && (!diagnosis || !diagnosis.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Clinical notes or diagnosis/assessment is required to complete consultation.',
      });
    }

    // 3. Process Prescription if medicines provided
    let prescription = null;
    if (Array.isArray(medicines) && medicines.length > 0) {
      const validMedicines = medicines.filter((m) => m && m.name && m.name.trim());
      if (validMedicines.length > 0) {
        if (appointment.prescriptionId) {
          prescription = await Prescription.findByIdAndUpdate(
            appointment.prescriptionId,
            {
              medicines: validMedicines,
              instructions: followUpInstructions || '',
            },
            { new: true }
          );
        } else {
          prescription = await Prescription.create({
            appointmentId: appointment._id,
            patientId: appointment.patientId,
            doctorId: doctor._id,
            medicines: validMedicines,
            instructions: followUpInstructions || '',
          });
          appointment.prescriptionId = prescription._id;
        }
      }
    }

    // 4. Generate post-visit summary
    let postVisitSummary = {
      whatWasDiscussed: '',
      medicationSchedule: [],
      importantInstructions: [],
      followUpSteps: '',
      whenToSeekHelp: '',
      status: 'pending',
    };

    try {
      postVisitSummary = await generatePostVisitSummary({
        diagnosis: diagnosis ? diagnosis.trim() : '',
        doctorNotes: doctorNotes ? doctorNotes.trim() : '',
        medicines: Array.isArray(medicines) ? medicines : [],
        followUpInstructions: followUpInstructions ? followUpInstructions.trim() : '',
      });
    } catch (aiErr) {
      console.warn('Post-visit AI generation non-fatal warning:', aiErr.message);
    }

    // 5. Update Appointment fields securely
    appointment.doctorNotes = doctorNotes ? doctorNotes.trim() : '';
    appointment.diagnosis = diagnosis ? diagnosis.trim() : '';
    appointment.followUpInstructions = followUpInstructions ? followUpInstructions.trim() : '';
    appointment.postVisitSummary = postVisitSummary;
    appointment.status = 'completed'; // Transition to COMPLETED
    await appointment.save();

    const populated = await Appointment.findById(appointment._id)
      .populate('patientId', 'name email phone')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email phone' } })
      .populate('prescriptionId');

    res.status(200).json({
      success: true,
      message: 'Consultation concluded and recorded successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Doctor Profile Details
// @route   GET /api/doctor/profile
// @access  Private (Doctor only)
exports.getProfile = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id }).populate('userId', 'name email phone role');
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Doctor Profile (Restricted fields: Cannot edit reg number or verification status)
// @route   PUT /api/doctor/profile
// @access  Private (Doctor only)
exports.updateProfile = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found.',
      });
    }

    const { phone, experience, consultationFee, bio, qualification } = req.body;

    // Update User phone if provided
    if (phone !== undefined) {
      await User.findByIdAndUpdate(req.user._id, { phone: phone.trim() });
    }

    // Update permissible doctor profile fields
    if (experience !== undefined) doctor.experience = Number(experience);
    if (consultationFee !== undefined) doctor.consultationFee = Number(consultationFee);
    if (bio !== undefined) doctor.bio = bio.trim();
    if (qualification !== undefined) doctor.qualification = qualification.trim();

    // Security: explicitly prevent doctor from updating registrationNumber, registrationCouncil, or verificationStatus
    // Those fields are strictly admin controlled

    await doctor.save();

    const updated = await Doctor.findById(doctor._id).populate('userId', 'name email phone role');
    await invalidateCachePattern('cache:doctors:*');

    res.status(200).json({
      success: true,
      message: 'Doctor profile updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Doctor Schedule (Working Hours + Leaves)
// @route   GET /api/doctor/schedule
// @access  Private (Doctor only)
exports.getSchedule = async (req, res, next) => {
  try {
    const doctor = await getDoctorForUser(req.user._id);
    const leaves = await DoctorLeave.find({ doctorId: doctor._id }).sort({ date: 1 });

    res.status(200).json({
      success: true,
      data: {
        workingHours: doctor.workingHours,
        slotDuration: doctor.slotDuration,
        leaves,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Doctor Working Hours & Slot Duration
// @route   PUT /api/doctor/schedule
// @access  Private (Doctor only)
exports.updateSchedule = async (req, res, next) => {
  try {
    const doctor = await getDoctorForUser(req.user._id);
    const { workingHours, slotDuration } = req.body;

    if (workingHours) doctor.workingHours = workingHours;
    if (slotDuration) doctor.slotDuration = Number(slotDuration);

    await doctor.save();
    await invalidateCachePattern('cache:doctors:*');

    res.status(200).json({
      success: true,
      message: 'Clinic working schedule updated.',
      data: {
        workingHours: doctor.workingHours,
        slotDuration: doctor.slotDuration,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add Doctor Scheduled Leave
// @route   POST /api/doctor/leaves
// @access  Private (Doctor only)
exports.addLeave = async (req, res, next) => {
  try {
    const doctor = await getDoctorForUser(req.user._id);
    const { date, reason } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Leave date is required (YYYY-MM-DD).',
      });
    }

    // Check duplicate leave date
    const existingLeave = await DoctorLeave.findOne({
      doctorId: doctor._id,
      date,
    });

    if (existingLeave) {
      return res.status(409).json({
        success: false,
        message: `Leave is already scheduled for ${date}.`,
      });
    }

    const leave = await DoctorLeave.create({
      doctorId: doctor._id,
      date,
      reason: reason ? reason.trim() : 'Personal Leave',
      status: 'approved',
    });

    // Find any booked appointments on this date and notify patients
    const affectedAppointments = await Appointment.find({
      doctorId: doctor._id,
      date,
      status: { $in: ['confirmed', 'held', 'pending'] },
    }).populate('patientId', 'name email');

    if (affectedAppointments.length > 0) {
      sendDoctorLeaveNotification({
        leave,
        doctor,
        affectedAppointments,
      }).catch((e) => console.warn('Doctor leave email notification non-fatal error:', e.message));
    }

    await invalidateCachePattern('cache:doctors:*');

    res.status(201).json({
      success: true,
      message: 'Leave scheduled successfully.',
      data: leave,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel Doctor Leave
// @route   DELETE /api/doctor/leaves/:id
// @access  Private (Doctor only)
exports.deleteLeave = async (req, res, next) => {
  try {
    const doctor = await getDoctorForUser(req.user._id);
    const leave = await DoctorLeave.findOneAndDelete({
      _id: req.params.id,
      doctorId: doctor._id,
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave record not found.',
      });
    }

    await invalidateCachePattern('cache:doctors:*');

    res.status(200).json({
      success: true,
      message: 'Leave cancelled successfully.',
    });
  } catch (error) {
    next(error);
  }
};
