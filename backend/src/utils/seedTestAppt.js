const mongoose = require('mongoose');
require('dotenv').config();
const { User, Doctor, Appointment } = require('../models');

async function seedAppt() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/careflow');
  const patient = await User.findOne({ email: 'patient@demo.com' });
  const doctor = await Doctor.findOne();

  const appt = await Appointment.create({
    patientId: patient._id,
    doctorId: doctor._id,
    date: new Date().toISOString().split('T')[0],
    startTime: '10:30',
    endTime: '11:00',
    status: 'confirmed',
    symptoms: 'Mild shortness of breath during brisk walking and occasional palpitations.',
    aiSummary: {
      chiefComplaint: 'Exertional dyspnea and palpitations.',
      triageUrgency: 'medium',
      suggestedQuestions: [
        'Check resting pulse and baseline ECG.',
        'Inquire about caffeine intake and sleep patterns.'
      ]
    }
  });

  console.log('SEEDED_APPOINTMENT_ID:' + appt._id);
  process.exit(0);
}

seedAppt();
