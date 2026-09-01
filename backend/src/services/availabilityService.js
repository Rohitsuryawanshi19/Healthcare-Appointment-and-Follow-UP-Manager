const { Doctor, DoctorLeave, Appointment } = require('../models');

/**
 * Converts HH:mm string to minutes from start of day (00:00 -> 0, 09:30 -> 570)
 */
function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Converts minutes from start of day to HH:mm string
 */
function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Gets day of week name from YYYY-MM-DD string
 */
function getDayOfWeekName(dateStr) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(Date.UTC(year, month - 1, day));
  return days[dateObj.getUTCDay()];
}

/**
 * Validates date string format YYYY-MM-DD and validity
 */
function isValidDateString(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const [year, month, day] = dateStr.split('-').map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;

  const dateObj = new Date(year, month - 1, day);
  return (
    dateObj.getFullYear() === year &&
    dateObj.getMonth() === month - 1 &&
    dateObj.getDate() === day
  );
}

/**
 * Cleans up all expired slot holds across the system
 */
async function cleanupExpiredHolds(now = new Date()) {
  try {
    await Appointment.updateMany(
      {
        status: 'held',
        $or: [{ expiresAt: { $lt: now } }, { heldUntil: { $lt: now } }],
      },
      {
        $set: { status: 'cancelled' },
      }
    );
  } catch (err) {
    console.error('Error during expired holds cleanup:', err.message);
  }
}

/**
 * Core Doctor Availability Calculation Engine
 *
 * @param {string} doctorId - Mongoose ObjectId string of Doctor
 * @param {string} dateStr - Date formatted as YYYY-MM-DD
 * @param {Date} [currentTime=new Date()] - Optional reference date/time for past slot evaluation
 * @returns {Promise<Object>} Structured availability object
 */
async function calculateDoctorAvailability(doctorId, dateStr, currentTime = new Date()) {
  if (!isValidDateString(dateStr)) {
    const error = new Error('Invalid date format. Expected YYYY-MM-DD.');
    error.status = 400;
    throw error;
  }

  // 1. Clean up expired holds on this calculation
  await cleanupExpiredHolds(currentTime);

  // 2. Fetch Doctor
  const doctor = await Doctor.findById(doctorId).populate('userId', 'name email');
  if (!doctor) {
    const error = new Error('Doctor not found.');
    error.status = 404;
    throw error;
  }

  const slotDuration = doctor.slotDuration || 30;
  const dayOfWeek = getDayOfWeekName(dateStr);

  // 3. Check if doctor is on Leave on this date
  const leave = await DoctorLeave.findOne({
    doctorId: doctor._id,
    date: dateStr,
    status: { $ne: 'rejected' },
  });

  if (leave) {
    return {
      date: dateStr,
      doctorId: doctor._id,
      doctorName: doctor.userId?.name || 'Doctor',
      slotDuration,
      dayOfWeek,
      isWorkingDay: false,
      isOnLeave: true,
      leaveReason: leave.reason || 'Doctor on leave',
      slots: [],
    };
  }

  // 4. Find working hours schedule for this day
  const daySchedule = doctor.workingHours?.find(
    (wh) => wh.day.toLowerCase() === dayOfWeek.toLowerCase()
  );

  if (!daySchedule || !daySchedule.isAvailable) {
    return {
      date: dateStr,
      doctorId: doctor._id,
      doctorName: doctor.userId?.name || 'Doctor',
      slotDuration,
      dayOfWeek,
      isWorkingDay: false,
      isOnLeave: false,
      slots: [],
    };
  }

  const workStartMinutes = timeToMinutes(daySchedule.startTime || '09:00');
  const workEndMinutes = timeToMinutes(daySchedule.endTime || '17:00');

  // 5. Fetch existing active appointments for this doctor on this date
  const appointments = await Appointment.find({
    doctorId: doctor._id,
    date: dateStr,
    status: { $in: ['confirmed', 'held', 'pending', 'completed'] },
  });

  // Map appointment start times to active status (ignoring expired holds)
  const bookedSlotMap = new Map();
  appointments.forEach((appt) => {
    if (appt.status === 'held') {
      const expiration = appt.expiresAt || appt.heldUntil;
      if (expiration && new Date(expiration) <= currentTime) {
        // Expired hold -> treat as available
        return;
      }
    }
    bookedSlotMap.set(appt.startTime, {
      status: appt.status,
      heldBy: appt.patientId,
      expiresAt: appt.expiresAt || appt.heldUntil,
    });
  });

  // 6. Evaluate today & current time to mark past slots as unavailable
  const todayStr = currentTime.toISOString().split('T')[0];
  const isPastDate = dateStr < todayStr;
  const isToday = dateStr === todayStr;
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  // 7. Generate sequential slots
  const slots = [];
  let currentSlotStart = workStartMinutes;

  while (currentSlotStart + slotDuration <= workEndMinutes) {
    const currentSlotEnd = currentSlotStart + slotDuration;
    const startTimeStr = minutesToTime(currentSlotStart);
    const endTimeStr = minutesToTime(currentSlotEnd);

    let status = 'available';
    let expiresAt = null;

    if (isPastDate) {
      status = 'unavailable';
    } else if (isToday && currentSlotStart <= currentMinutes) {
      status = 'unavailable';
    } else if (bookedSlotMap.has(startTimeStr)) {
      const slotInfo = bookedSlotMap.get(startTimeStr);
      if (slotInfo.status === 'held' || slotInfo.status === 'pending') {
        status = 'held';
        expiresAt = slotInfo.expiresAt;
      } else {
        status = 'booked';
      }
    }

    slots.push({
      startTime: startTimeStr,
      endTime: endTimeStr,
      status,
      ...(expiresAt ? { expiresAt } : {}),
    });

    currentSlotStart += slotDuration;
  }

  return {
    date: dateStr,
    doctorId: doctor._id,
    doctorName: doctor.userId?.name || 'Doctor',
    slotDuration,
    dayOfWeek,
    isWorkingDay: true,
    isOnLeave: false,
    slots,
  };
}

module.exports = {
  timeToMinutes,
  minutesToTime,
  getDayOfWeekName,
  isValidDateString,
  cleanupExpiredHolds,
  calculateDoctorAvailability,
};
