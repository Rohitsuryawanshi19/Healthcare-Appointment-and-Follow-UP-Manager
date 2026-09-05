const mongoose = require('mongoose');
const logger = require('./logger');

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

    logger.info({ host: conn.connection.host }, 'MongoDB connected successfully');

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

    logger.debug('MongoDB Compound Unique Indexes Synchronized');

    // Attach connection lifecycle event handlers
    mongoose.connection.on('error', (err) => {
      logger.error({ err: err.message }, 'MongoDB Connection Error');
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB connection lost. Reconnecting...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB connection re-established.');
    });

    return conn;
  } catch (error) {
    logger.error({ err: error.message }, 'MongoDB Connection Error');
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
