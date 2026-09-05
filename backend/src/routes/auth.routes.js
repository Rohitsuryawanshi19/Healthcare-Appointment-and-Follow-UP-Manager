const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

const { validate } = require('../middleware/validate.middleware');
const { authLimiter, registerLimiter } = require('../middleware/rateLimiter.middleware');
const { loginSchema, registerSchema } = require('../validators');

// Public Auth Endpoints (Protected by Rate Limiters & Zod Validation)
router.post('/register', registerLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/google', authLimiter, authController.googleAuth);
router.post('/logout', authController.logout);

// Protected Auth Endpoints
router.get('/me', requireAuth, authController.getMe);

// Example test routes for verification
router.get('/patient-only', requireAuth, requireRole('patient'), (req, res) => {
  res.json({ success: true, message: 'Access granted to Patient Portal', user: req.user.name });
});

router.get('/doctor-only', requireAuth, requireRole('doctor'), (req, res) => {
  res.json({ success: true, message: 'Access granted to Doctor Portal', user: req.user.name });
});

router.get('/admin-only', requireAuth, requireRole('admin'), (req, res) => {
  res.json({ success: true, message: 'Access granted to Admin Portal', user: req.user.name });
});

module.exports = router;
