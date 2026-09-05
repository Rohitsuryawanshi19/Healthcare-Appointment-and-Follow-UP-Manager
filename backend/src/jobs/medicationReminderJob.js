const cron = require('node-cron');
const logger = require('../config/logger');
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
    logger.debug('Background Notification Job runner is already active.');
    return cronTask;
  }

  // Run every minute (or configurable interval)
  cronTask = cron.schedule('* * * * *', async () => {
    try {
      // 1. Process all due medication reminders
      const { processedCount } = await processDueReminders(new Date());
      if (processedCount > 0) {
        logger.info({ processedCount }, '[NotificationJob] Processed and delivered medication reminders.');
      }

      // 2. Scan active prescriptions to ensure all upcoming doses have notifications scheduled
      const activePrescriptions = await Prescription.find().sort({ createdAt: -1 }).limit(50);
      for (const rx of activePrescriptions) {
        await generateRemindersForPrescription(rx._id);
      }

      // 3. Retry failed transactional emails (up to 3 retries)
      const retryResult = await retryPendingAndFailedEmails();
      if (retryResult.succeededCount > 0) {
        logger.info({ succeededCount: retryResult.succeededCount }, '[NotificationJob] Successfully re-delivered transactional emails.');
      }
    } catch (err) {
      logger.error({ err: err.message }, '[NotificationJob] Error in background job execution');
    }
  });

  logger.info('[NotificationJob] Background Cron Runner initialized (every minute).');
  return cronTask;
}

function stopMedicationReminderJob() {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
    logger.info('[NotificationJob] Background Cron Runner stopped.');
  }
}

module.exports = {
  startMedicationReminderJob,
  stopMedicationReminderJob,
  processDueReminders,
  generateRemindersForPrescription,
  retryPendingAndFailedEmails,
};
