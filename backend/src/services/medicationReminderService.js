const { Notification, Prescription, User } = require('../models');
const { emitNotification } = require('./socketService');

/**
 * Parses duration string (e.g., "5 days", "14 days", "1 month", "2 weeks") into number of days
 */
function parseDurationInDays(durationStr = '') {
  if (!durationStr || typeof durationStr !== 'string') return 5;
  const lower = durationStr.toLowerCase().trim();

  const numMatch = lower.match(/\d+/);
  const num = numMatch ? parseInt(numMatch[0], 10) : 5;

  if (lower.includes('month')) return num * 30;
  if (lower.includes('week')) return num * 7;
  return Math.max(1, num); // Default in days
}

/**
 * Gets daily notification hours based on prescription frequency
 */
function getDailyHoursForFrequency(frequencyStr = '') {
  const freq = (frequencyStr || '').toLowerCase().trim();

  if (freq.includes('twice') || freq.includes('bid') || freq.includes('2 times') || freq.includes('every 12 hours')) {
    return [9, 21]; // 09:00 AM, 09:00 PM
  }
  if (freq.includes('three') || freq.includes('tid') || freq.includes('3 times') || freq.includes('tds')) {
    return [9, 14, 21]; // 09:00 AM, 02:00 PM, 09:00 PM
  }
  if (freq.includes('8 hour') || freq.includes('every 8')) {
    return [6, 14, 22]; // 06:00 AM, 02:00 PM, 10:00 PM
  }
  if (freq.includes('four') || freq.includes('qid') || freq.includes('6 hour')) {
    return [6, 12, 18, 23]; // 06:00 AM, 12:00 PM, 06:00 PM, 11:00 PM
  }
  if (freq.includes('as needed') || freq.includes('sos') || freq.includes('prn')) {
    return []; // On demand
  }
  // Default: Once daily
  return [9]; // 09:00 AM
}

/**
 * Calculates all scheduled reminder Date timestamps for a single medicine
 */
function calculateMedicineSchedule(medicine, startDate = new Date()) {
  const days = parseDurationInDays(medicine.duration);
  const hours = getDailyHoursForFrequency(medicine.frequency);

  if (hours.length === 0) return []; // As needed (no fixed schedule)

  const schedule = [];
  const start = new Date(startDate);
  start.setMinutes(0, 0, 0);

  for (let d = 0; d < days; d++) {
    for (const h of hours) {
      const scheduledTime = new Date(start);
      scheduledTime.setDate(scheduledTime.getDate() + d);
      scheduledTime.setHours(h, 0, 0, 0);
      schedule.push(scheduledTime);
    }
  }

  return schedule;
}

/**
 * Computes next upcoming reminder Date for a medicine
 */
function getNextReminderTime(medicine, prescriptionCreatedAt = new Date(), currentTime = new Date()) {
  const schedule = calculateMedicineSchedule(medicine, prescriptionCreatedAt);
  const next = schedule.find((t) => t > currentTime);
  return next || null;
}

/**
 * Generates and stores scheduled Notification records in MongoDB for an active prescription
 * Duplicate notifications are guaranteed to be prevented via unique compound index + upsert logic.
 */
async function generateRemindersForPrescription(prescriptionId) {
  const prescription = await Prescription.findById(prescriptionId).populate('patientId');
  if (!prescription || !prescription.patientId) return { scheduledCount: 0 };

  const patientId = prescription.patientId._id;
  const createdAt = prescription.createdAt || new Date();
  let scheduledCount = 0;

  for (const med of prescription.medicines || []) {
    const timestamps = calculateMedicineSchedule(med, createdAt);

    for (const time of timestamps) {
      try {
        const mealTiming = med.timing ? ` (${med.timing.replace('_', ' ')})` : '';
        const instructions = med.instructions ? ` - ${med.instructions}` : '';

        await Notification.updateOne(
          {
            userId: patientId,
            prescriptionId: prescription._id,
            medicineName: med.name,
            scheduledFor: time,
          },
          {
            $setOnInsert: {
              userId: patientId,
              prescriptionId: prescription._id,
              medicineName: med.name,
              type: 'medication_reminder',
              title: `Medication Reminder: ${med.name}`,
              message: `Time to take ${med.name} (${med.dosage}) - ${med.frequency}${mealTiming}${instructions}`,
              status: 'scheduled',
              channel: 'in_app',
              scheduledFor: time,
              metadata: {
                dosage: med.dosage,
                frequency: med.frequency,
                timing: med.timing,
              },
            },
          },
          { upsert: true }
        );
        scheduledCount++;
      } catch (err) {
        // Catch duplicate key collision if triggered concurrently
        if (err.code !== 11000) {
          console.error('Error scheduling reminder notification:', err.message);
        }
      }
    }
  }

  return { scheduledCount };
}

/**
 * Processes all due scheduled reminders and transitions them to 'sent'
 */
async function processDueReminders(now = new Date()) {
  try {
    const dueReminders = await Notification.find({
      type: 'medication_reminder',
      status: 'scheduled',
      scheduledFor: { $lte: now },
    });

    if (dueReminders.length === 0) return { processedCount: 0 };

    const result = await Notification.updateMany(
      {
        _id: { $in: dueReminders.map((r) => r._id) },
        status: 'scheduled',
      },
      {
        $set: { status: 'sent', sentAt: now },
      }
    );

    // Emit live in-app reminders to connected patients
    dueReminders.forEach((r) => {
      emitNotification(r.userId, {
        _id: r._id,
        type: 'medication_reminder',
        title: r.title || `Medication Reminder: ${r.medicineName}`,
        message: r.message,
        scheduledFor: r.scheduledFor,
      });
    });

    return { processedCount: result.modifiedCount };
  } catch (error) {
    console.error('Error processing due medication reminders:', error.message);
    return { processedCount: 0 };
  }
}

module.exports = {
  parseDurationInDays,
  getDailyHoursForFrequency,
  calculateMedicineSchedule,
  getNextReminderTime,
  generateRemindersForPrescription,
  processDueReminders,
};
