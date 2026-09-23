const cron = require('node-cron');
const { Appointment, User, Patient } = require('../models');
const { sendFollowUpPingEmail } = require('../services/emailService');
const logger = console; // Quick logger for job

let followUpPingCronTask = null;

/**
 * Job that runs once a day at 10:00 AM to send follow-up pings
 * for appointments that were completed 3 days ago.
 */
function startFollowUpPingJob() {
  if (followUpPingCronTask) {
    logger.info('[FollowUpPingJob] Job is already running.');
    return followUpPingCronTask;
  }

  // Run at 10:00 AM every day
  followUpPingCronTask = cron.schedule('0 10 * * *', async () => {
    try {
      logger.info('[FollowUpPingJob] Starting daily check for follow-up pings...');

      // Find 3 days ago date range
      const today = new Date();
      const threeDaysAgoStart = new Date(today);
      threeDaysAgoStart.setDate(threeDaysAgoStart.getDate() - 3);
      threeDaysAgoStart.setHours(0, 0, 0, 0);

      const threeDaysAgoEnd = new Date(today);
      threeDaysAgoEnd.setDate(threeDaysAgoEnd.getDate() - 3);
      threeDaysAgoEnd.setHours(23, 59, 59, 999);

      // Find completed appointments from exactly 3 days ago where no ping was sent
      const appointments = await Appointment.find({
        status: 'completed',
        date: { $gte: threeDaysAgoStart, $lte: threeDaysAgoEnd },
        followUpPingSent: false,
      }).populate({
        path: 'patientId',
        populate: { path: 'userId' }
      }).populate({
        path: 'doctorId',
        populate: { path: 'userId' }
      });

      if (!appointments || appointments.length === 0) {
        logger.info('[FollowUpPingJob] No follow-ups to send today.');
        return;
      }

      logger.info(`[FollowUpPingJob] Found ${appointments.length} appointments to follow up on.`);

      let sentCount = 0;
      for (const appt of appointments) {
        if (!appt.patientId) continue;
        
        const patientUser = appt.patientId.userId || appt.patientId;
        if (!patientUser || !patientUser.email) continue;

        const doctorName = appt.doctorId?.userId?.name || 'your doctor';

        // Send email
        await sendFollowUpPingEmail(patientUser.email, patientUser.name, doctorName);

        // Mark as sent
        appt.followUpPingSent = true;
        await appt.save();
        sentCount++;
      }

      logger.info(`[FollowUpPingJob] Successfully sent ${sentCount} follow-up pings.`);
    } catch (error) {
      logger.error(`[FollowUpPingJob] Error executing job: ${error.message}`, error);
    }
  });

  logger.info('[FollowUpPingJob] Background Cron Runner initialized (every day at 10:00 AM).');
  return followUpPingCronTask;
}

function stopFollowUpPingJob() {
  if (followUpPingCronTask) {
    followUpPingCronTask.stop();
    followUpPingCronTask = null;
    logger.info('[FollowUpPingJob] Background Cron Runner stopped.');
  }
}

module.exports = {
  startFollowUpPingJob,
  stopFollowUpPingJob,
};
