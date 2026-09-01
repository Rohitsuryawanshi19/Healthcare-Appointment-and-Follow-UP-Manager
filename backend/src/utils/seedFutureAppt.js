const mongoose = require('mongoose');
require('dotenv').config();
const { User, Doctor, Appointment } = require('../models');

async function seedFutureAppt() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/careflow');
  const patient = await User.findOne({ email: 'patient@demo.com' });
  const doctor = await Doctor.findOne();

  // Create appointment on Monday 2026-09-07 at 11:00
  const appt = await Appointment.findOneAndUpdate(
    { doctorId: doctor._id, date: '2026-09-07', startTime: '11:00' },
    {
      patientId: patient._id,
      doctorId: doctor._id,
      date: '2026-09-07',
      startTime: '11:00',
      endTime: '11:30',
      status: 'confirmed',
      symptoms: 'Routine checkup'
    },
    { upsert: true, new: true }
  );

  console.log('SEEDED_FUTURE_APPT:' + appt._id);
  process.exit(0);
}

seedFutureAppt();
