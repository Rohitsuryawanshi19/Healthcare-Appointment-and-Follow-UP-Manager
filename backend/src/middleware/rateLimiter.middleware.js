const rateLimit = require('express-rate-limit');

const isTest = process.env.NODE_ENV === 'test' || !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

/**
 * Strict Rate Limiter for Authentication Endpoints (Brute-force protection)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTest ? 1000 : 20, // High ceiling in local dev/test, strict in production
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP address. Please try again in 15 minutes.',
  },
});

/**
 * Registration Rate Limiter to prevent spam account generation
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isTest ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Account creation rate limit reached. Please try again later.',
  },
});

/**
 * General API Limiter for DDoS & scraping protection
 */
const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 5000 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
  },
});

/**
 * Strict Rate Limiter for Interactive AI Chat (prevents model resource abuse)
 */
const aiChatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 1000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'AI assistant rate limit reached. Please wait a few minutes before sending more queries.',
  },
});

module.exports = {
  authLimiter,
  registerLimiter,
  generalApiLimiter,
  aiChatLimiter,
};
