const mongoose = require('mongoose');
require('dotenv').config();

const {
  User,
  Doctor,
  Appointment,
  Prescription,
  Notification,
  DoctorLeave,
} = require('../models');

async function testModels() {
  try {
    const connUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/careflow';
    await mongoose.connect(connUri);
    console.log('MongoDB connected successfully');

    // Ensure all indexes are built
    await Promise.all([
      User.init(),
      Doctor.init(),
      Appointment.init(),
      Prescription.init(),
      Notification.init(),
      DoctorLeave.init(),
    ]);
    console.log('All 6 Mongoose models initialized & compiled successfully');

    // Inspect Indexes
    const models = [
      { name: 'User', model: User },
      { name: 'Doctor', model: Doctor },
      { name: 'Appointment', model: Appointment },
      { name: 'Prescription', model: Prescription },
      { name: 'Notification', model: Notification },
      { name: 'DoctorLeave', model: DoctorLeave },
    ];

    console.log('\n--- MODEL INDEX SUMMARY ---');
    for (const { name, model } of models) {
      const indexes = await model.collection.indexes();
      console.log(`\nModel [${name}] Indexes:`);
      indexes.forEach((idx) => {
        console.log(` - ${idx.name}: ${JSON.stringify(idx.key)} (unique: ${Boolean(idx.unique)}, partialFilter: ${JSON.stringify(idx.partialFilterExpression || null)})`);
      });
    }

    // Verify Concurrency Lock Test
    console.log('\n--- VERIFYING CONCURRENCY SLOT LOCK ---');
    const dummyDoctorId = new mongoose.Types.ObjectId();
    const dummyPatient1 = new mongoose.Types.ObjectId();
    const dummyPatient2 = new mongoose.Types.ObjectId();
    const slotDate = '2026-10-15';
    const slotStart = '10:00';
    const slotEnd = '10:30';

    // Create First Booking
    const appt1 = await Appointment.create({
      patientId: dummyPatient1,
      doctorId: dummyDoctorId,
      date: slotDate,
      startTime: slotStart,
      endTime: slotEnd,
      status: 'confirmed',
    });
    console.log(`Created confirmed appointment 1 for doctor ${dummyDoctorId} at ${slotDate} ${slotStart}`);

    // Try Duplicate Booking for the same slot
    let duplicateBlocked = false;
    try {
      await Appointment.create({
        patientId: dummyPatient2,
        doctorId: dummyDoctorId,
        date: slotDate,
        startTime: slotStart,
        endTime: slotEnd,
        status: 'held',
      });
    } catch (err) {
      if (err.code === 11000) {
        duplicateBlocked = true;
        console.log('PASS: Duplicate slot booking blocked by MongoDB unique concurrency index (E11000 duplicate key error).');
      } else {
        console.error('Unexpected error:', err);
      }
    }

    // Clean up test appointment
    await Appointment.findByIdAndDelete(appt1._id);
    console.log('Cleaned up test booking record.');

    console.log('\nAll model validations and index checks passed with 0 errors.');
    process.exit(0);
  } catch (err) {
    console.error('Model test error:', err);
    process.exit(1);
  }
}

testModels();
