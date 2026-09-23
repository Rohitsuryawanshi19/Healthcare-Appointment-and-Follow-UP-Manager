/**
 * Database Seeder - Creates demo users for testing
 * Run: node backend/src/scripts/seed.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not set. Add it to backend/.env');
  process.exit(1);
}

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    phone: { type: String, default: '' },
    role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    googleId: { type: String, sparse: true },
    avatarUrl: { type: String, default: '' },
    specialization: { type: String, default: '' },
    experience: { type: Number, default: 0 },
    fee: { type: Number, default: 0 },
    bio: { type: String, default: '' },
    isApproved: { type: Boolean, default: true },
    googleCalendar: {
      isConnected: { type: Boolean, default: false },
      calendarEmail: { type: String, default: '' },
      tokens: { type: mongoose.Schema.Types.Mixed, default: null },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('User', userSchema);

const demoUsers = [
  {
    name: 'Alice (Patient Demo)',
    email: 'patient.a@demo.com',
    password: 'DemoPassword123!',
    role: 'patient',
    phone: '+91-9000000001',
    authProvider: 'local',
    avatarUrl: '',
  },
  {
    name: 'Dr. Sarah Mitchell',
    email: 'doctor@demo.com',
    password: 'DemoPassword123!',
    role: 'doctor',
    phone: '+91-9000000002',
    authProvider: 'local',
    specialization: 'General Medicine',
    experience: 8,
    fee: 500,
    bio: 'Experienced general physician with 8 years of practice.',
    isApproved: true,
    avatarUrl: '',
  },
  {
    name: 'Admin User',
    email: 'admin@demo.com',
    password: 'DemoPassword123!',
    role: 'admin',
    phone: '+91-9000000003',
    authProvider: 'local',
    avatarUrl: '',
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected');

    for (const userData of demoUsers) {
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        console.log(`⏭️  Skipping ${userData.email} (already exists)`);
        continue;
      }
      const user = new User(userData);
      await user.save();
      console.log(`✅ Created: ${userData.email} [${userData.role}]`);
    }

    console.log('\n🎉 Seeding complete!');
    console.log('Demo credentials:');
    console.log('  patient.a@demo.com / DemoPassword123!');
    console.log('  doctor@demo.com    / DemoPassword123!');
    console.log('  admin@demo.com     / DemoPassword123!');
  } catch (err) {
    console.error('❌ Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
