const cron = require('node-cron');
const { Prescription } = require('../models');
const {
  processDueReminders,
  generateRemindersForPrescription,
} = require('../services/medicationReminderService');
const { retryPendingAndFailedEmails } = require('../services/emailService');

let cronTask = null;

/**
 * Interface for Background Notification & Reminder Job System
 * Designed for seamless upgrade to BullMQ / Redis workers in distributed production.
 */
function startMedicationReminderJob() {
  if (cronTask) {
    console.log('Background Notification Job runner is already active.');
    return cronTask;
  }

  // Run every minute (or configurable interval)
  cronTask = cron.schedule('* * * * *', async () => {
    try {
      // 1. Process all due medication reminders
      const { processedCount } = await processDueReminders(new Date());
      if (processedCount > 0) {
        console.log(`[NotificationJob] Processed and delivered ${processedCount} medication reminders.`);
      }

      // 2. Scan active prescriptions to ensure all upcoming doses have notifications scheduled
      const activePrescriptions = await Prescription.find().sort({ createdAt: -1 }).limit(50);
      for (const rx of activePrescriptions) {
        await generateRemindersForPrescription(rx._id);
      }

      // 3. Retry failed transactional emails (up to 3 retries)
      const retryResult = await retryPendingAndFailedEmails();
      if (retryResult.succeededCount > 0) {
        console.log(`[NotificationJob] Successfully re-delivered ${retryResult.succeededCount} transactional emails.`);
      }
    } catch (err) {
      console.error('[NotificationJob] Error in background job execution:', err.message);
    }
  });

  console.log('[NotificationJob] Background Cron Runner initialized (every minute).');
  return cronTask;
}

function stopMedicationReminderJob() {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
    console.log('[NotificationJob] Background Cron Runner stopped.');
  }
}

module.exports = {
  startMedicationReminderJob,
  stopMedicationReminderJob,
  processDueReminders,
  generateRemindersForPrescription,
  retryPendingAndFailedEmails,
};
