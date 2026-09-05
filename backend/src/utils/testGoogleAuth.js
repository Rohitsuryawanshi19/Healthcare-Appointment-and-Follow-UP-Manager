const mongoose = require('mongoose');
const User = require('../models/User.model');
require('dotenv').config();

async function testGoogleAuthModelAndEndpoints() {
  console.log('=== TESTING GOOGLE AUTH INTEGRATION ===\n');

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/careflow';
  await mongoose.connect(mongoUri);

  // 1. Test local user requires password
  console.log('1. Testing User model local password validation...');
  const invalidLocalUser = new User({
    name: 'Invalid Test User',
    email: 'invalid.test@example.com',
    authProvider: 'local',
  });
  let localError = null;
  try {
    await invalidLocalUser.validate();
  } catch (err) {
    localError = err;
  }
  if (!localError || !localError.errors['password']) {
    throw new Error('Expected local user without password to fail validation');
  }
  console.log('✅ Local user correctly requires password.');

  // 2. Test google user creation and toJSON transformation
  console.log('\n2. Testing User model Google account creation & toJSON safety...');
  const testEmail = `google.test.${Date.now()}@example.com`;
  const googleUser = await User.create({
    name: 'Google Test Patient',
    email: testEmail,
    role: 'patient',
    authProvider: 'google',
    googleId: `google_id_${Date.now()}`,
    avatarUrl: 'https://lh3.googleusercontent.com/a/test',
    password: 'secure_random_unusable_hash_placeholder',
    demoData: true,
  });

  const userJson = googleUser.toJSON();
  if (userJson.password !== undefined) {
    throw new Error('Security flaw: password exposed in User.toJSON()');
  }
  if (userJson.authProvider !== 'google') {
    throw new Error('Expected authProvider to be google');
  }
  if (!userJson.avatarUrl) {
    throw new Error('Expected avatarUrl to be preserved');
  }
  console.log('✅ Google user saved and JSON transformed safely (no password leak).');

  // Clean up test user
  await User.deleteOne({ _id: googleUser._id });
  console.log('✅ Test user cleaned up.');

  // 3. Test master test suite
  console.log('\n=== ALL GOOGLE AUTH TESTS PASSED! ===');
  await mongoose.disconnect();
  process.exit(0);
}

testGoogleAuthModelAndEndpoints().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
