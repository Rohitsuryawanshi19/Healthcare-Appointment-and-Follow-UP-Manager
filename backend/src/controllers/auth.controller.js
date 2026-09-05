const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { verifyGoogleIdToken } = require('../services/googleAuthService');

// Helper to generate JWT and set secure HTTP-only cookie
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_careflow_min_32_chars_long';
  const token = jwt.sign({ id: user._id, role: user.role }, secret, {
    expiresIn: '7d',
  });

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      message,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          authProvider: user.authProvider || 'local',
          avatarUrl: user.avatarUrl || '',
          createdAt: user.createdAt,
        },
        token, // Also return in body for clients preferring header auth
      },
    });
};

// @desc    Register a new patient
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Check duplicate email
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Public registration is strictly restricted to 'patient' role
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone ? phone.trim() : '',
      role: 'patient',
      authProvider: 'local',
    });

    sendTokenResponse(user, 201, res, 'Registration successful. Welcome to CareFlow!');
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    // Find user and select password
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check password match
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    sendTokenResponse(user, 200, res, 'Login successful.');
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate or Register via Google ID Token
// @route   POST /api/auth/google
// @access  Public
exports.googleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Google ID token.',
      });
    }

    let googlePayload;
    try {
      googlePayload = await verifyGoogleIdToken(idToken);
    } catch (verifyErr) {
      return res.status(401).json({
        success: false,
        message: verifyErr.message || 'Google authentication verification failed.',
      });
    }

    const { googleId, email, name, avatarUrl } = googlePayload;

    // 1. Check if user already exists with this googleId or email
    let user = await User.findOne({
      $or: [{ googleId }, { email }],
    });

    if (user) {
      let isModified = false;

      // Link googleId if existing user signed in with password previously
      if (!user.googleId) {
        user.googleId = googleId;
        isModified = true;
      }

      // Update avatar if not already set
      if (!user.avatarUrl && avatarUrl) {
        user.avatarUrl = avatarUrl;
        isModified = true;
      }

      if (isModified) {
        await user.save();
      }

      return sendTokenResponse(user, 200, res, 'Google sign-in successful.');
    }

    // 2. If new user: create account strictly with 'patient' role
    const unusablePasswordHash = crypto.randomBytes(32).toString('hex');

    user = await User.create({
      name: name || 'CareFlow Patient',
      email,
      role: 'patient', // Server-enforced: Google signup only grants patient role
      authProvider: 'google',
      googleId,
      avatarUrl: avatarUrl || '',
      password: unusablePasswordHash,
    });

    return sendTokenResponse(
      user,
      201,
      res,
      'Google registration successful. Welcome to CareFlow!'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Log user out & clear cookie
// @route   POST /api/auth/logout
// @access  Public
exports.logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000), // 5 seconds
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

// @desc    Get current authenticated user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        authProvider: req.user.authProvider || 'local',
        avatarUrl: req.user.avatarUrl || '',
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt,
      },
    },
  });
};
