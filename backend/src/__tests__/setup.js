const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.PORT = '5001';
  process.env.JWT_SECRET = 'super_secret_jwt_key_careflow_min_32_chars_long';
  process.env.JWT_REFRESH_SECRET = 'super_secret_jwt_key_careflow_min_32_chars_long_refresh';
  process.env.COOKIE_SAME_SITE = 'lax';
  process.env.COOKIE_SECURE = 'false';

  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGO_URI = uri;

  await mongoose.connect(uri);

  // Sync Mongoose compound unique indexes in test DB
  const { Appointment, Doctor, User, DoctorLeave, Notification, Prescription } = require('../models');
  await Promise.all([
    Appointment.syncIndexes(),
    Doctor.syncIndexes(),
    User.syncIndexes(),
    DoctorLeave.syncIndexes(),
    Notification.syncIndexes(),
    Prescription.syncIndexes(),
  ]);
});

afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongod) {
    await mongod.stop();
  }
});
