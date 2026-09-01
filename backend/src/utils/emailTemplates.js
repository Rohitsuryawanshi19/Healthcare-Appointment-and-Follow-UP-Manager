/**
 * Base email layout wrapper for clean, professional healthcare styling
 */
function wrapEmailLayout(title, contentHtml) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px 12px; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #0f766e; padding: 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 4px 0 0 0; font-size: 12px; color: #ccfbf1; }
    .content { padding: 32px 24px; line-height: 1.6; font-size: 14px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0; }
    .card-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
    .card-row:last-child { margin-bottom: 0; }
    .label { color: #64748b; font-weight: 600; }
    .value { color: #0f172a; font-weight: 700; }
    .btn { display: inline-block; background: #0f766e; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 13px; font-weight: 700; margin-top: 16px; }
    .footer { background: #f1f5f9; padding: 20px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .footer p { margin: 4px 0; }
    .alert-box { background: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 16px; margin: 20px 0; color: #9f1239; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CareFlow Healthcare</h1>
      <p>Clinical Appointment Notification</p>
    </div>
    <div class="content">
      ${contentHtml}
    </div>
    <div class="footer">
      <p>CareFlow Certified Digital Health EHR Platform</p>
      <p>This is an automated transactional notification. Confidential medical details are preserved inside your secure patient portal.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

exports.getBookingConfirmationTemplate = ({ recipientName, doctorName, patientName, date, startTime, endTime, isDoctor, appointmentId }) => {
  const content = `
    <h2 style="margin-top:0; color:#0f766e; font-size:18px;">Appointment Confirmed</h2>
    <p>Hello <strong>${recipientName}</strong>,</p>
    <p>${isDoctor ? `A new clinical appointment has been scheduled with you by ${patientName}.` : `Your appointment with <strong>Dr. ${doctorName}</strong> is confirmed.`}</p>

    <div class="card">
      <div class="card-row"><span class="label">Patient:</span> <span class="value">${patientName}</span></div>
      <div class="card-row"><span class="label">Doctor:</span> <span class="value">Dr. ${doctorName}</span></div>
      <div class="card-row"><span class="label">Date:</span> <span class="value">${date}</span></div>
      <div class="card-row"><span class="label">Time Window:</span> <span class="value">${startTime} - ${endTime}</span></div>
      <div class="card-row"><span class="label">Status:</span> <span class="value" style="color:#0f766e;">Confirmed</span></div>
      <div class="card-row"><span class="label">Reference ID:</span> <span class="value font-mono">${String(appointmentId).substring(0, 10)}</span></div>
    </div>

    <p style="font-size:12px; color:#64748b;">Please arrive 10 minutes prior to your consultation. You can view preparation notes or reschedule in your dashboard.</p>
  `;
  return wrapEmailLayout('CareFlow - Appointment Confirmation', content);
};

exports.getCancellationTemplate = ({ recipientName, doctorName, patientName, date, startTime, isDoctor, appointmentId }) => {
  const content = `
    <h2 style="margin-top:0; color:#e11d48; font-size:18px;">Appointment Cancelled</h2>
    <p>Hello <strong>${recipientName}</strong>,</p>
    <p>The consultation scheduled for <strong>${date} at ${startTime}</strong> has been cancelled.</p>

    <div class="card" style="border-color:#fecdd3; background:#fff1f2;">
      <div class="card-row"><span class="label">Patient:</span> <span class="value">${patientName}</span></div>
      <div class="card-row"><span class="label">Doctor:</span> <span class="value">Dr. ${doctorName}</span></div>
      <div class="card-row"><span class="label">Cancelled Slot:</span> <span class="value">${date} at ${startTime}</span></div>
      <div class="card-row"><span class="label">Reference ID:</span> <span class="value font-mono">${String(appointmentId).substring(0, 10)}</span></div>
    </div>

    <p style="font-size:12px; color:#64748b;">The time slot has been released. If you wish to re-book, please visit the CareFlow directory.</p>
  `;
  return wrapEmailLayout('CareFlow - Appointment Cancellation', content);
};

exports.getRescheduleTemplate = ({ recipientName, doctorName, patientName, oldDate, oldTime, newDate, newTime, isDoctor, appointmentId }) => {
  const content = `
    <h2 style="margin-top:0; color:#0f766e; font-size:18px;">Appointment Rescheduled</h2>
    <p>Hello <strong>${recipientName}</strong>,</p>
    <p>The consultation between <strong>${patientName}</strong> and <strong>Dr. ${doctorName}</strong> has been successfully rescheduled.</p>

    <div class="card">
      <div class="card-row"><span class="label">Previous Schedule:</span> <span class="value" style="color:#94a3b8; text-decoration:line-through;">${oldDate} at ${oldTime}</span></div>
      <div class="card-row"><span class="label">New Confirmed Schedule:</span> <span class="value" style="color:#0f766e;">${newDate} at ${newTime}</span></div>
      <div class="card-row"><span class="label">Doctor:</span> <span class="value">Dr. ${doctorName}</span></div>
      <div class="card-row"><span class="label">Patient:</span> <span class="value">${patientName}</span></div>
      <div class="card-row"><span class="label">Reference ID:</span> <span class="value font-mono">${String(appointmentId).substring(0, 10)}</span></div>
    </div>

    <p style="font-size:12px; color:#64748b;">Your new consultation slot is confirmed in the electronic schedule.</p>
  `;
  return wrapEmailLayout('CareFlow - Appointment Rescheduled', content);
};

exports.getAppointmentReminderTemplate = ({ patientName, doctorName, date, startTime, appointmentId }) => {
  const content = `
    <h2 style="margin-top:0; color:#0f766e; font-size:18px;">Upcoming Consultation Reminder</h2>
    <p>Hello <strong>${patientName}</strong>,</p>
    <p>This is a reminder for your upcoming medical visit with <strong>Dr. ${doctorName}</strong>.</p>

    <div class="card">
      <div class="card-row"><span class="label">Doctor:</span> <span class="value">Dr. ${doctorName}</span></div>
      <div class="card-row"><span class="label">Date:</span> <span class="value">${date}</span></div>
      <div class="card-row"><span class="label">Time:</span> <span class="value">${startTime}</span></div>
      <div class="card-row"><span class="label">Reference ID:</span> <span class="value font-mono">${String(appointmentId).substring(0, 10)}</span></div>
    </div>

    <p style="font-size:12px; color:#64748b;">Have your pre-visit symptom notes ready for your physician review.</p>
  `;
  return wrapEmailLayout('CareFlow - Upcoming Visit Reminder', content);
};

exports.getDoctorLeaveNotificationTemplate = ({ patientName, doctorName, date, leaveReason, appointmentId }) => {
  const content = `
    <h2 style="margin-top:0; color:#b45309; font-size:18px;">Schedule Notice: Physician Leave</h2>
    <p>Hello <strong>${patientName}</strong>,</p>
    <p>We are writing to inform you that <strong>Dr. ${doctorName}</strong> is on scheduled leave on <strong>${date}</strong> (${leaveReason || 'Clinical unavailability'}).</p>

    <div class="alert-box">
      <strong>Action Required:</strong> Your appointment originally set for ${date} has been released. Please log in to choose an alternate convenient slot or specialist.
    </div>

    <p style="font-size:12px; color:#64748b;">We apologize for any inconvenience caused to your medical schedule.</p>
  `;
  return wrapEmailLayout('CareFlow - Physician Schedule Notice', content);
};
