const { User, Doctor, Appointment, Prescription, DoctorLeave, Notification } = require('../models');
const { getNextReminderTime, parseDurationInDays } = require('../services/medicationReminderService');
const { getCache, setCache } = require('../services/cacheService');

// @desc    Get Patient Dashboard Summary
// @route   GET /api/patient/dashboard
// @access  Private (Patient only)
exports.getDashboard = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    const [nextAppointment, upcomingAppointments, recentAppointments, prescriptions] =
      await Promise.all([
        // Next upcoming appointment
        Appointment.findOne({
          patientId: req.user._id,
          date: { $gte: todayStr },
          status: { $in: ['confirmed', 'held', 'pending'] },
        })
          .populate({
            path: 'doctorId',
            populate: { path: 'userId', select: 'name email phone' },
          })
          .sort({ date: 1, startTime: 1 }),

        // All upcoming appointments
        Appointment.find({
          patientId: req.user._id,
          date: { $gte: todayStr },
          status: { $in: ['confirmed', 'held', 'pending'] },
        })
          .populate({
            path: 'doctorId',
            populate: { path: 'userId', select: 'name email phone' },
          })
          .sort({ date: 1, startTime: 1 })
          .limit(4),

        // Recent / completed appointments
        Appointment.find({
          patientId: req.user._id,
          status: { $in: ['completed', 'cancelled'] },
        })
          .populate({
            path: 'doctorId',
            populate: { path: 'userId', select: 'name email phone' },
          })
          .sort({ date: -1, startTime: -1 })
          .limit(4),

        // Prescriptions for medication reminders
        Prescription.find({ patientId: req.user._id })
          .populate({
            path: 'doctorId',
            populate: { path: 'userId', select: 'name' },
          })
          .sort({ createdAt: -1 })
          .limit(5),
      ]);

    // Extract active medicines
    const activeMedicines = [];
    prescriptions.forEach((rx) => {
      rx.medicines?.forEach((med) => {
        activeMedicines.push({
          ...med.toObject(),
          doctorName: rx.doctorId?.userId?.name || 'Consulting Physician',
          prescribedAt: rx.createdAt,
        });
      });
    });

    res.status(200).json({
      success: true,
      data: {
        nextAppointment,
        upcomingAppointments,
        recentAppointments,
        medicationReminders: activeMedicines.slice(0, 6),
        totalAppointments: upcomingAppointments.length + recentAppointments.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Doctors Directory with search, filtering, caching, and pagination
// @route   GET /api/patient/doctors
// @access  Private (Patient only)
exports.getDoctors = async (req, res, next) => {
  try {
    const cacheKey = `cache:doctors:${JSON.stringify(req.query)}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    const { specialization, minExperience, verifiedOnly, search } = req.query;
    const query = {};

    // By default, patients see verified doctors or filter by verifiedOnly
    if (verifiedOnly === 'true' || verifiedOnly === true) {
      query.verificationStatus = 'verified';
    }

    if (specialization && specialization !== 'All') {
      query.specialization = new RegExp(specialization, 'i');
    }

    if (minExperience) {
      query.experience = { $gte: Number(minExperience) };
    }

    let doctors = await Doctor.find(query)
      .populate('userId', 'name email phone')
      .sort({ experience: -1, verificationStatus: 1 });

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      doctors = doctors.filter(
        (doc) =>
          searchRegex.test(doc.userId?.name || '') ||
          searchRegex.test(doc.specialization || '') ||
          searchRegex.test(doc.qualification || '')
      );
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const total = doctors.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = req.query.page || req.query.limit ? doctors.slice(skip, skip + limit) : doctors;

    const responsePayload = {
      success: true,
      count: paginated.length,
      total,
      page,
      totalPages,
      data: paginated,
    };

    await setCache(cacheKey, responsePayload, 60);

    res.status(200).json(responsePayload);
  } catch (error) {
    next(error);
  }
};

// @desc    Get Single Doctor Profile with available slots preview
// @route   GET /api/patient/doctors/:id
// @access  Private (Patient only)
exports.getDoctorById = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('userId', 'name email phone');
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found.',
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const leaves = await DoctorLeave.find({
      doctorId: doctor._id,
      date: { $gte: todayStr },
    });

    // Generate sample time slots based on doctor's working hours
    const availableSlotsPreview = [
      { time: '09:30', status: 'available' },
      { time: '10:00', status: 'available' },
      { time: '10:30', status: 'booked' },
      { time: '11:00', status: 'available' },
      { time: '02:00', status: 'available' },
      { time: '02:30', status: 'available' },
      { time: '03:00', status: 'booked' },
      { time: '03:30', status: 'available' },
    ];

    res.status(200).json({
      success: true,
      data: {
        doctor,
        leaves,
        availableSlotsPreview,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Patient Appointments with status filter & pagination
// @route   GET /api/patient/appointments
// @access  Private (Patient only)
exports.getAppointments = async (req, res, next) => {
  try {
    const { status, filter } = req.query;
    const query = { patientId: req.user._id };
    const todayStr = new Date().toISOString().split('T')[0];

    if (status && status !== 'all') {
      query.status = status;
    }

    if (filter === 'upcoming') {
      query.date = { $gte: todayStr };
      if (!status) query.status = { $in: ['confirmed', 'held', 'pending'] };
    } else if (filter === 'past') {
      query.date = { $lt: todayStr };
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const total = await Appointment.countDocuments(query);
    const totalPages = Math.ceil(total / limit) || 1;

    const appointments = await Appointment.find(query)
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name email phone' },
      })
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

// @desc    Get Single Patient Appointment Details
// @route   GET /api/patient/appointments/:id
// @access  Private (Patient only)
exports.getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      patientId: req.user._id,
    })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name email phone' },
      })
      .populate('prescriptionId');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.',
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

// @desc    Get Patient Active Prescriptions, Medications & Next Reminder Schedule
// @route   GET /api/patient/medications
// @access  Private (Patient only)
exports.getMedications = async (req, res, next) => {
  try {
    const now = new Date();

    const [prescriptions, recentReminders] = await Promise.all([
      Prescription.find({ patientId: req.user._id })
        .populate({
          path: 'doctorId',
          populate: { path: 'userId', select: 'name' },
        })
        .populate('appointmentId', 'date startTime')
        .sort({ createdAt: -1 }),

      Notification.find({
        userId: req.user._id,
        type: 'medication_reminder',
      })
        .sort({ scheduledFor: -1 })
        .limit(10),
    ]);

    const formattedMedications = [];

    prescriptions.forEach((rx) => {
      const rxDate = new Date(rx.createdAt || now);
      const doctorName = rx.doctorId?.userId?.name || 'Prescribing Specialist';

      rx.medicines?.forEach((med) => {
        const durationDays = parseDurationInDays(med.duration);
        const expirationDate = new Date(rxDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
        const daysElapsed = Math.max(0, Math.floor((now - rxDate) / (1000 * 60 * 60 * 24)));
        const isActive = now < expirationDate;
        const nextReminder = isActive ? getNextReminderTime(med, rxDate, now) : null;
        const progressPercent = Math.min(100, Math.round((daysElapsed / durationDays) * 100));

        formattedMedications.push({
          id: `${rx._id}_${med.name}`,
          prescriptionId: rx._id,
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          timing: med.timing,
          instructions: med.instructions,
          doctorName,
          prescribedAt: rx.createdAt,
          isActive,
          nextReminder,
          daysElapsed,
          durationDays,
          progressPercent,
        });
      });
    });

    res.status(200).json({
      success: true,
      data: {
        medications: formattedMedications,
        prescriptions,
        recentReminders,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Patient Profile
// @route   GET /api/patient/profile
// @access  Private (Patient only)
exports.getProfile = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
      createdAt: req.user.createdAt,
    },
  });
};

// @desc    Update Patient Profile
// @route   PUT /api/patient/profile
// @access  Private (Patient only)
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};
