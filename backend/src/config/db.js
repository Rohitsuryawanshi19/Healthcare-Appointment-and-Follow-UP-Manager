const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/careflow';
    
    // Configure production-ready connection options
    const conn = await mongoose.connect(connUri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      autoIndex: true,
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    }

    // Synchronize Mongoose compound unique indexes to guarantee database-level concurrency protection
    const { Appointment, Doctor, User, DoctorLeave, Notification, Prescription } = require('../models');
    await Promise.all([
      Appointment.syncIndexes(),
      Doctor.syncIndexes(),
      User.syncIndexes(),
      DoctorLeave.syncIndexes(),
      Notification.syncIndexes(),
      Prescription.syncIndexes(),
    ]);

    if (process.env.NODE_ENV !== 'production') {
      console.log('MongoDB Compound Unique Indexes Synchronized');
    }

    // Attach connection lifecycle event handlers
    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB Connection Error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB connection lost. Reconnecting...');
    });

    mongoose.connection.on('reconnected', () => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('MongoDB connection re-established.');
      }
    });

    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
