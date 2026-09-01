const nodemailer = require('nodemailer');
const { Notification, User } = require('../models');
const {
  getBookingConfirmationTemplate,
  getCancellationTemplate,
  getRescheduleTemplate,
  getAppointmentReminderTemplate,
  getDoctorLeaveNotificationTemplate,
} = require('../utils/emailTemplates');

let transporterInstance = null;

/**
 * Initializes or returns existing Nodemailer transporter instance
 */
function getTransporter() {
  if (transporterInstance) return transporterInstance;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporterInstance = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development / Test JSON transport that doesn't require active external SMTP server
    transporterInstance = nodemailer.createTransport({
      jsonTransport: true,
    });
  }

  return transporterInstance;
}

/**
 * Core internal sender with Notification DB tracking, error interception, and retry counters
 */
async function sendEmailWithTracking({ to, subject, html, userId, type, metadata = {}, mockFail = false }) {
  const from = process.env.EMAIL_FROM || 'CareFlow Healthcare <notifications@careflow.com>';

  // 1. Create initial Notification record in MongoDB (status: pending)
  let notification = null;
  if (userId) {
    try {
      notification = await Notification.create({
        userId,
        type,
        title: subject,
        message: `Email notification sent to ${to}: ${subject}`,
        channel: 'email',
        status: 'pending',
        metadata: { ...metadata, to, subject },
      });
    } catch (dbErr) {
      console.warn('Failed to create notification tracking record:', dbErr.message);
    }
  }

  // 2. Dispatch Email through Transporter
  try {
    if (mockFail) {
      throw new Error('Simulated SMTP connection failure');
    }

    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    // 3. On success, update Notification record
    if (notification) {
      notification.status = 'sent';
      notification.sentAt = new Date();
      await notification.save();
    }

    return {
      success: true,
      messageId: info.messageId,
      notificationId: notification?._id,
    };
  } catch (error) {
    console.warn(`[EmailService] Non-fatal dispatch error to ${to}: ${error.message}`);

    // 4. On failure, record failure status and increment retry count without crashing caller
    if (notification) {
      notification.status = 'failed';
      notification.retryCount = (notification.retryCount || 0) + 1;
      notification.metadata = { ...notification.metadata, error: error.message };
      await notification.save();
    }

    return {
      success: false,
      error: error.message,
      notificationId: notification?._id,
    };
  }
}

/**
 * 1. Send Booking Confirmation (to BOTH patient and doctor)
 */
async function sendBookingConfirmation({ appointment, patient, doctor, options = {} }) {
  const patientEmail = patient?.email || patient?.userId?.email;
  const doctorEmail = doctor?.userId?.email || doctor?.email;

  const patientName = patient?.name || patient?.userId?.name || 'Patient';
  const doctorName = doctor?.userId?.name || doctor?.name || 'Physician';

  const results = [];

  // Send to Patient
  if (patientEmail) {
    const html = getBookingConfirmationTemplate({
      recipientName: patientName,
      doctorName,
      patientName,
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      isDoctor: false,
      appointmentId: appointment._id,
    });

    const resP = await sendEmailWithTracking({
      to: patientEmail,
      subject: `Appointment Confirmed with Dr. ${doctorName} - ${appointment.date}`,
      html,
      userId: patient._id || patient.userId?._id,
      type: 'appointment_confirmed',
      metadata: { appointmentId: appointment._id, role: 'patient' },
      mockFail: options.mockFailPatient,
    });
    results.push(resP);
  }

  // Send to Doctor
  if (doctorEmail) {
    const html = getBookingConfirmationTemplate({
      recipientName: `Dr. ${doctorName}`,
      doctorName,
      patientName,
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      isDoctor: true,
      appointmentId: appointment._id,
    });

    const resD = await sendEmailWithTracking({
      to: doctorEmail,
      subject: `New Clinical Consultation Booked: ${patientName} - ${appointment.date}`,
      html,
      userId: doctor.userId?._id || doctor._id,
      type: 'appointment_confirmed',
      metadata: { appointmentId: appointment._id, role: 'doctor' },
      mockFail: options.mockFailDoctor,
    });
    results.push(resD);
  }

  return results;
}

/**
 * 2. Send Cancellation Email (to BOTH patient and doctor)
 */
async function sendCancellationEmail({ appointment, patient, doctor, cancelledBy, options = {} }) {
  const patientEmail = patient?.email || patient?.userId?.email;
  const doctorEmail = doctor?.userId?.email || doctor?.email;

  const patientName = patient?.name || patient?.userId?.name || 'Patient';
  const doctorName = doctor?.userId?.name || doctor?.name || 'Physician';

  const results = [];

  if (patientEmail) {
    const html = getCancellationTemplate({
      recipientName: patientName,
      doctorName,
      patientName,
      date: appointment.date,
      startTime: appointment.startTime,
      isDoctor: false,
      appointmentId: appointment._id,
    });

    const resP = await sendEmailWithTracking({
      to: patientEmail,
      subject: `Appointment Cancelled: Dr. ${doctorName} - ${appointment.date}`,
      html,
      userId: patient._id || patient.userId?._id,
      type: 'appointment_cancelled',
      metadata: { appointmentId: appointment._id, cancelledBy },
      mockFail: options.mockFail,
    });
    results.push(resP);
  }

  if (doctorEmail) {
    const html = getCancellationTemplate({
      recipientName: `Dr. ${doctorName}`,
      doctorName,
      patientName,
      date: appointment.date,
      startTime: appointment.startTime,
      isDoctor: true,
      appointmentId: appointment._id,
    });

    const resD = await sendEmailWithTracking({
      to: doctorEmail,
      subject: `Appointment Cancelled by ${cancelledBy || 'Patient'}: ${patientName} - ${appointment.date}`,
      html,
      userId: doctor.userId?._id || doctor._id,
      type: 'appointment_cancelled',
      metadata: { appointmentId: appointment._id, cancelledBy },
      mockFail: options.mockFail,
    });
    results.push(resD);
  }

  return results;
}

/**
 * 3. Send Reschedule Email (to patient & doctor)
 */
async function sendRescheduleEmail({ oldAppointment, newAppointment, patient, doctor, options = {} }) {
  const patientEmail = patient?.email || patient?.userId?.email;
  const doctorEmail = doctor?.userId?.email || doctor?.email;

  const patientName = patient?.name || patient?.userId?.name || 'Patient';
  const doctorName = doctor?.userId?.name || doctor?.name || 'Physician';

  const results = [];

  if (patientEmail) {
    const html = getRescheduleTemplate({
      recipientName: patientName,
      doctorName,
      patientName,
      oldDate: oldAppointment.date,
      oldTime: oldAppointment.startTime,
      newDate: newAppointment.date,
      newTime: newAppointment.startTime,
      isDoctor: false,
      appointmentId: newAppointment._id,
    });

    const resP = await sendEmailWithTracking({
      to: patientEmail,
      subject: `Appointment Rescheduled: Dr. ${doctorName} - ${newAppointment.date}`,
      html,
      userId: patient._id || patient.userId?._id,
      type: 'appointment_rescheduled',
      metadata: { newAppointmentId: newAppointment._id },
      mockFail: options.mockFail,
    });
    results.push(resP);
  }

  if (doctorEmail) {
    const html = getRescheduleTemplate({
      recipientName: `Dr. ${doctorName}`,
      doctorName,
      patientName,
      oldDate: oldAppointment.date,
      oldTime: oldAppointment.startTime,
      newDate: newAppointment.date,
      newTime: newAppointment.startTime,
      isDoctor: true,
      appointmentId: newAppointment._id,
    });

    const resD = await sendEmailWithTracking({
      to: doctorEmail,
      subject: `Schedule Update: ${patientName} Rescheduled to ${newAppointment.date}`,
      html,
      userId: doctor.userId?._id || doctor._id,
      type: 'appointment_rescheduled',
      metadata: { newAppointmentId: newAppointment._id },
      mockFail: options.mockFail,
    });
    results.push(resD);
  }

  return results;
}

/**
 * 4. Send Appointment Reminder (to patient)
 */
async function sendAppointmentReminder({ appointment, patient, doctor, options = {} }) {
  const patientEmail = patient?.email || patient?.userId?.email;
  const patientName = patient?.name || patient?.userId?.name || 'Patient';
  const doctorName = doctor?.userId?.name || doctor?.name || 'Physician';

  if (!patientEmail) return { success: false, message: 'No patient email' };

  const html = getAppointmentReminderTemplate({
    patientName,
    doctorName,
    date: appointment.date,
    startTime: appointment.startTime,
    appointmentId: appointment._id,
  });

  return sendEmailWithTracking({
    to: patientEmail,
    subject: `Reminder: Upcoming Medical Consultation with Dr. ${doctorName}`,
    html,
    userId: patient._id || patient.userId?._id,
    type: 'appointment_reminder',
    metadata: { appointmentId: appointment._id },
    mockFail: options.mockFail,
  });
}

/**
 * 5. Send Doctor Leave Notification (to all affected patients)
 */
async function sendDoctorLeaveNotification({ leave, doctor, affectedAppointments = [], options = {} }) {
  const doctorName = doctor?.userId?.name || doctor?.name || 'Physician';
  const results = [];

  for (const appt of affectedAppointments) {
    let patientUser = appt.patientId;
    if (!patientUser?.email && patientUser) {
      patientUser = await User.findById(patientUser);
    }

    const patientEmail = patientUser?.email;
    const patientName = patientUser?.name || 'Patient';

    if (patientEmail) {
      const html = getDoctorLeaveNotificationTemplate({
        patientName,
        doctorName,
        date: leave.date,
        leaveReason: leave.reason,
        appointmentId: appt._id,
      });

      const res = await sendEmailWithTracking({
        to: patientEmail,
        subject: `Physician Schedule Notice: Dr. ${doctorName} on ${leave.date}`,
        html,
        userId: patientUser._id || appt.patientId,
        type: 'leave_alert',
        metadata: { appointmentId: appt._id, leaveDate: leave.date },
        mockFail: options.mockFail,
      });
      results.push(res);
    }
  }

  return results;
}

/**
 * Background Retry Handler: Retries failed or pending email notifications up to 3 times
 */
async function retryPendingAndFailedEmails() {
  try {
    const failedNotifications = await Notification.find({
      channel: 'email',
      status: { $in: ['failed', 'pending'] },
      retryCount: { $lt: 3 },
    }).limit(20);

    if (failedNotifications.length === 0) return { retriedCount: 0, succeededCount: 0 };

    let succeededCount = 0;
    const transporter = getTransporter();

    for (const notif of failedNotifications) {
      const to = notif.metadata?.to;
      const subject = notif.metadata?.subject || notif.title;

      if (!to) {
        notif.status = 'failed';
        notif.retryCount = 3;
        await notif.save();
        continue;
      }

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || 'CareFlow Healthcare <notifications@careflow.com>',
          to,
          subject,
          html: `<p>${notif.message}</p>`,
        });

        notif.status = 'sent';
        notif.sentAt = new Date();
        await notif.save();
        succeededCount++;
      } catch (err) {
        notif.retryCount = (notif.retryCount || 0) + 1;
        notif.status = 'failed';
        await notif.save();
      }
    }

    return { retriedCount: failedNotifications.length, succeededCount };
  } catch (error) {
    console.error('Error during email retry worker execution:', error.message);
    return { retriedCount: 0, succeededCount: 0 };
  }
}

module.exports = {
  getTransporter,
  sendEmailWithTracking,
  sendBookingConfirmation,
  sendAppointmentReminder,
  sendCancellationEmail,
  sendDoctorLeaveNotification,
  sendRescheduleEmail,
  retryPendingAndFailedEmails,
  retryFailedNotifications: retryPendingAndFailedEmails,
};
