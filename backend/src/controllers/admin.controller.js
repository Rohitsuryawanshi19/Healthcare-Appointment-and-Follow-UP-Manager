const { User, Doctor, Appointment, DoctorLeave, Notification } = require('../models');
const { sendDoctorLeaveNotification, sendCancellationEmail } = require('../services/emailService');
const { deleteCalendarEvent } = require('../services/calendarService');

// @desc    Get Admin Dashboard KPI Statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
exports.getDashboardStats = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    const [
      totalDoctors,
      verifiedDoctors,
      pendingVerification,
      totalPatients,
      totalAdmins,
      todayAppointments,
      upcomingAppointments,
      cancelledAppointments,
      completedAppointments,
    ] = await Promise.all([
      Doctor.countDocuments(),
      Doctor.countDocuments({ verificationStatus: 'verified' }),
      Doctor.countDocuments({ verificationStatus: 'pending' }),
      User.countDocuments({ role: 'patient' }),
      User.countDocuments({ role: 'admin' }),
      Appointment.countDocuments({ date: todayStr }),
      Appointment.countDocuments({
        date: { $gte: todayStr },
        status: { $in: ['confirmed', 'pending', 'held'] },
      }),
      Appointment.countDocuments({ status: 'cancelled' }),
      Appointment.countDocuments({ status: 'completed' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalDoctors,
        verifiedDoctors,
        pendingVerification,
        totalPatients,
        totalAdmins,
        todayAppointments,
        upcomingAppointments,
        cancelledAppointments,
        completedAppointments,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all doctors with filtering and search
// @route   GET /api/admin/doctors
// @access  Private (Admin only)
exports.getDoctors = async (req, res, next) => {
  try {
    const { status, specialization, search } = req.query;
    const query = {};

    if (status) {
      query.verificationStatus = status;
    }
    if (specialization) {
      query.specialization = new RegExp(specialization, 'i');
    }

    let doctors = await Doctor.find(query)
      .populate('userId', 'name email phone role createdAt')
      .sort({ createdAt: -1 });

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      doctors = doctors.filter(
        (doc) =>
          searchRegex.test(doc.userId?.name || '') ||
          searchRegex.test(doc.userId?.email || '') ||
          searchRegex.test(doc.specialization) ||
          searchRegex.test(doc.registrationNumber)
      );
    }

    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new doctor (User account + Doctor profile)
// @route   POST /api/admin/doctors
// @access  Private (Admin only)
exports.createDoctor = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      specialization,
      qualification,
      registrationNumber,
      registrationCouncil,
      experience,
      consultationFee,
      bio,
      slotDuration,
      workingHours,
      verificationStatus = 'pending',
    } = req.body;

    if (!name || !email || !password || !specialization || !qualification || !registrationNumber || !registrationCouncil) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password, specialization, qualification, registration number and council.',
      });
    }

    // Check duplicate user email
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Check duplicate registration number
    const existingDoctor = await Doctor.findOne({ registrationNumber: registrationNumber.trim() });
    if (existingDoctor) {
      return res.status(409).json({
        success: false,
        message: 'A doctor with this Medical Registration Number already exists.',
      });
    }

    // 1. Create User with role 'doctor'
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone ? phone.trim() : '',
      role: 'doctor',
    });

    // 2. Create Doctor profile
    const doctor = await Doctor.create({
      userId: user._id,
      specialization: specialization.trim(),
      qualification: qualification.trim(),
      registrationNumber: registrationNumber.trim(),
      registrationCouncil: registrationCouncil.trim(),
      experience: Number(experience) || 0,
      consultationFee: Number(consultationFee) || 500,
      bio: bio ? bio.trim() : '',
      slotDuration: Number(slotDuration) || 30,
      workingHours: workingHours || undefined,
      verificationStatus,
      verifiedAt: verificationStatus === 'verified' ? new Date() : null,
      verificationSource: 'Admin Console Provisioning',
    });

    const populatedDoctor = await Doctor.findById(doctor._id).populate('userId', 'name email phone role');

    res.status(201).json({
      success: true,
      message: 'Doctor profile created successfully.',
      data: populatedDoctor,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get doctor details by ID
// @route   GET /api/admin/doctors/:id
// @access  Private (Admin only)
exports.getDoctorById = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('userId', 'name email phone role createdAt');
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    const leaves = await DoctorLeave.find({ doctorId: doctor._id }).sort({ date: 1 });
    const appointmentsCount = await Appointment.countDocuments({ doctorId: doctor._id });

    res.status(200).json({
      success: true,
      data: {
        doctor,
        leaves,
        totalAppointments: appointmentsCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update doctor details
// @route   PUT /api/admin/doctors/:id
// @access  Private (Admin only)
exports.updateDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    const {
      name,
      phone,
      specialization,
      qualification,
      registrationNumber,
      registrationCouncil,
      experience,
      consultationFee,
      bio,
      slotDuration,
      workingHours,
    } = req.body;

    // Update User details if provided
    if (name || phone !== undefined) {
      await User.findByIdAndUpdate(doctor.userId, {
        ...(name && { name: name.trim() }),
        ...(phone !== undefined && { phone: phone.trim() }),
      });
    }

    // Update Doctor details
    if (specialization) doctor.specialization = specialization.trim();
    if (qualification) doctor.qualification = qualification.trim();
    if (registrationNumber) doctor.registrationNumber = registrationNumber.trim();
    if (registrationCouncil) doctor.registrationCouncil = registrationCouncil.trim();
    if (experience !== undefined) doctor.experience = Number(experience);
    if (consultationFee !== undefined) doctor.consultationFee = Number(consultationFee);
    if (bio !== undefined) doctor.bio = bio.trim();
    if (slotDuration !== undefined) doctor.slotDuration = Number(slotDuration);
    if (workingHours) doctor.workingHours = workingHours;

    await doctor.save();

    const updatedDoctor = await Doctor.findById(doctor._id).populate('userId', 'name email phone role');

    res.status(200).json({
      success: true,
      message: 'Doctor updated successfully',
      data: updatedDoctor,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify, reject or update doctor verification status
// @route   PATCH /api/admin/doctors/:id/status
// @access  Private (Admin only)
exports.updateDoctorVerification = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['pending', 'verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification status. Must be pending, verified, or rejected.',
      });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    doctor.verificationStatus = status;
    doctor.verifiedAt = status === 'verified' ? new Date() : null;
    doctor.verificationSource = `Admin verification by ${req.user.name}`;
    await doctor.save();

    const updatedDoctor = await Doctor.findById(doctor._id).populate('userId', 'name email phone role');

    res.status(200).json({
      success: true,
      message: `Doctor verification status updated to ${status}.`,
      data: updatedDoctor,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all appointments across the system
// @route   GET /api/admin/appointments
// @access  Private (Admin only)
exports.getAppointments = async (req, res, next) => {
  try {
    const { status, date } = req.query;
    const query = {};

    if (status) query.status = status;
    if (date) query.date = date;

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email phone')
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name email phone' },
      })
      .sort({ date: -1, startTime: -1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all registered users with role breakdown
// @route   GET /api/admin/users
// @access  Private (Admin only)
exports.getUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const query = {};

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Preview affected appointments before marking doctor unavailable
// @route   GET /api/admin/doctors/:id/leave-preview
// @access  Private (Admin only)
exports.getDoctorLeavePreview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Valid leave date is required (YYYY-MM-DD).',
      });
    }

    const doctor = await Doctor.findById(id).populate('userId', 'name email phone');
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    // Check if leave already scheduled on this date
    const existingLeave = await DoctorLeave.findOne({ doctorId: doctor._id, date });

    // Find all active appointments that will be affected
    const affectedAppointments = await Appointment.find({
      doctorId: doctor._id,
      date,
      status: { $in: ['confirmed', 'held', 'pending'] },
    })
      .populate('patientId', 'name email phone')
      .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      data: {
        date,
        doctorName: doctor.userId?.name || 'Physician',
        isAlreadyOnLeave: Boolean(existingLeave),
        affectedCount: affectedAppointments.length,
        affectedAppointments,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all scheduled leaves for a doctor
// @route   GET /api/admin/doctors/:id/leaves
// @access  Private (Admin only)
exports.getDoctorLeaves = async (req, res, next) => {
  try {
    const { id } = req.params;
    const leaves = await DoctorLeave.find({ doctorId: id }).sort({ date: 1 });

    res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark doctor unavailable (Hardened leave creation with appointment cancellation & notifications)
// @route   POST /api/admin/doctors/:id/leaves
// @access  Private (Admin only)
exports.addDoctorLeave = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date, reason } = req.body;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Valid leave date is required (YYYY-MM-DD).',
      });
    }

    const doctor = await Doctor.findById(id).populate('userId', 'name email phone');
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    // Check for repeated leave on same date
    const existingLeave = await DoctorLeave.findOne({ doctorId: doctor._id, date });
    if (existingLeave) {
      return res.status(409).json({
        success: false,
        message: `Doctor is already marked on leave for ${date}.`,
      });
    }

    // 1. Create DoctorLeave document
    const leave = await DoctorLeave.create({
      doctorId: doctor._id,
      date,
      reason: reason ? reason.trim() : 'Administrative Schedule Unavailability',
      status: 'approved',
    });

    // 2. Find all existing active appointments on this date
    const affectedAppointments = await Appointment.find({
      doctorId: doctor._id,
      date,
      status: { $in: ['confirmed', 'held', 'pending'] },
    }).populate('patientId', 'name email phone');

    // 3. Update affected appointments to 'cancelled' and delete Google Calendar events
    for (const appt of affectedAppointments) {
      const gcalId = appt.googleCalendarEventId;
      appt.status = 'cancelled';
      appt.googleCalendarEventId = '';
      appt.googleCalendarSyncStatus = 'none';
      await appt.save();

      // Delete event from Google Calendar
      if (gcalId) {
        deleteCalendarEvent({
          appointmentId: appt._id,
          googleCalendarEventId: gcalId,
        }).catch((e) => console.warn('Google Calendar leave delete warning:', e.message));
      }
    }

    // 4. Send transactional notification emails to affected patients
    if (affectedAppointments.length > 0) {
      sendDoctorLeaveNotification({
        leave,
        doctor,
        affectedAppointments,
      }).catch((e) => console.warn('Leave patient notification email warning:', e.message));
    }

    // 5. Notify the doctor about administrative leave placement
    if (doctor.userId?.email) {
      sendCancellationEmail({
        appointment: { date, startTime: 'All day' },
        patient: { name: 'Administrative Schedule Update' },
        doctor,
        cancelledBy: `Admin (${req.user?.name || 'CareFlow Administrator'})`,
      }).catch((e) => console.warn('Doctor leave notice email warning:', e.message));
    }

    res.status(201).json({
      success: true,
      message: `Doctor marked unavailable on ${date}. ${affectedAppointments.length} existing appointments cancelled and notified.`,
      data: {
        leave,
        affectedCount: affectedAppointments.length,
        affectedAppointments,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove/Cancel Doctor Leave (Reopens working day slots)
// @route   DELETE /api/admin/doctors/:id/leaves/:leaveId
// @access  Private (Admin only)
exports.removeDoctorLeave = async (req, res, next) => {
  try {
    const { id, leaveId } = req.params;

    const leave = await DoctorLeave.findOneAndDelete({ _id: leaveId, doctorId: id });
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Scheduled leave record not found.' });
    }

    res.status(200).json({
      success: true,
      message: `Leave on ${leave.date} removed. Consultation slots are now open according to working hours.`,
      data: leave,
    });
  } catch (error) {
    next(error);
  }
};
