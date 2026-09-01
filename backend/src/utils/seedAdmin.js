const mongoose = require('mongoose');
require('dotenv').config();

const { User, Doctor } = require('../models');

async function seedAdminAndDemo() {
  try {
    const connUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/careflow';
    await mongoose.connect(connUri);
    console.log('Connected to MongoDB for admin seeding');

    // 1. Seed Admin
    let admin = await User.findOne({ email: 'admin@demo.com' });
    if (!admin) {
      admin = await User.create({
        name: 'System Administrator',
        email: 'admin@demo.com',
        password: 'DemoPassword123!',
        phone: '+91 99999 11111',
        role: 'admin',
      });
      console.log('Seeded Admin account: admin@demo.com / DemoPassword123!');
    } else {
      admin.role = 'admin';
      await admin.save();
      console.log('Admin account already exists.');
    }

    // 2. Seed Doctor
    let doctorUser = await User.findOne({ email: 'doctor@demo.com' });
    if (!doctorUser) {
      doctorUser = await User.create({
        name: 'Dr. Sarah Patel',
        email: 'doctor@demo.com',
        password: 'DemoPassword123!',
        phone: '+91 98765 12345',
        role: 'doctor',
      });
      console.log('Seeded Doctor user: doctor@demo.com');
    }

    let doctorProfile = await Doctor.findOne({ userId: doctorUser._id });
    if (!doctorProfile) {
      doctorProfile = await Doctor.create({
        userId: doctorUser._id,
        specialization: 'Cardiology',
        qualification: 'MBBS, MD (Cardiology)',
        registrationNumber: 'MCI-DEL-2015-99281',
        registrationCouncil: 'Delhi Medical Council',
        experience: 12,
        consultationFee: 700,
        bio: 'Senior consultant cardiologist specializing in preventive cardiology, echocardiography, and hypertension management.',
        slotDuration: 30,
        verificationStatus: 'verified',
        verifiedAt: new Date(),
        verificationSource: 'Admin Seeding',
      });
      console.log('Seeded Doctor profile for Dr. Sarah Patel');
    }

    // 3. Seed Patient
    let patient = await User.findOne({ email: 'patient@demo.com' });
    if (!patient) {
      patient = await User.create({
        name: 'Rohit Suryawanshi',
        email: 'patient@demo.com',
        password: 'DemoPassword123!',
        phone: '+91 91234 56789',
        role: 'patient',
      });
      console.log('Seeded Patient account: patient@demo.com / DemoPassword123!');
    }

    console.log('Demo accounts ready.');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seedAdminAndDemo();
