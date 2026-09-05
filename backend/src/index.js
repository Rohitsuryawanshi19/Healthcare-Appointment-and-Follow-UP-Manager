const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const Sentry = require('@sentry/node');
require('dotenv').config();

// 0. Sentry Initialization (gated behind SENTRY_DSN)
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  });
}

// 1. Fast-Fail Environment Variable Validation
const { validateEnv } = require('./config/envValidator');
validateEnv();

const logger = require('./config/logger');
const connectDB = require('./config/db');
const { initSocket } = require('./services/socketService');
const { startMedicationReminderJob } = require('./jobs/medicationReminderJob');
const { correlationIdMiddleware } = require('./middleware/correlationId.middleware');
const { generalApiLimiter } = require('./middleware/rateLimiter.middleware');

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const doctorRoutes = require('./routes/doctor.routes');
const patientRoutes = require('./routes/patient.routes');
const availabilityRoutes = require('./routes/availability.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const aiRoutes = require('./routes/ai.routes');
const calendarRoutes = require('./routes/calendar.routes');

const app = express();
const server = http.createServer(app);

// Initialize real-time Socket.IO service
initSocket(server);

// 2. Connect Database (skipped in test mode; managed by test harness)
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// 3. Request Correlation ID & Structured Logging
app.use(correlationIdMiddleware);

// 4. Production-Grade HTTP Security Headers with Helmet & Content Security Policy
const isProd = process.env.NODE_ENV === 'production';
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://accounts.google.com',
          'https://apis.google.com',
          'https://ssl.gstatic.com',
        ],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: [
          "'self'",
          'data:',
          'https://lh3.googleusercontent.com',
          'https://avatars.githubusercontent.com',
        ],
        connectSrc: [
          "'self'",
          'https://accounts.google.com',
          'https://generativelanguage.googleapis.com',
          ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
          ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
        ],
        frameSrc: ["'self'", 'https://accounts.google.com'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: isProd ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  })
);

// 5. Secure, Explicit CORS Configuration
const rawOrigins = [
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  process.env.ALLOWED_ORIGINS,
  process.env.TRUSTED_ORIGINS,
]
  .filter(Boolean)
  .join(',');

const envOrigins = rawOrigins
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

const defaultDevOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

const allowedOrigins = Array.from(new Set([...envOrigins, ...defaultDevOrigins]));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, server-to-server, mobile app)
      if (!origin) return callback(null, true);

      const normalized = origin.trim().replace(/\/$/, '');
      if (allowedOrigins.includes(normalized)) {
        return callback(null, true);
      }

      logger.warn({ origin }, `[CORS Blocked] Origin not in allowed whitelist: '${origin}'`);
      return callback(new Error(`Blocked by CORS policy: Origin '${origin}' is not authorized.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-Correlation-ID'],
  })
);

// 6. Rate Limiting for General API Surface
app.use('/api', generalApiLimiter);

// 7. Body Parsers with Memory Limits & Cookie Parser
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// 8. Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/doctors', availabilityRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/calendar', calendarRoutes);

// Health Check Route (Live Database Readiness Check)
app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const statusCode = isDbConnected ? 200 : 503;
  res.status(statusCode).json({
    status: isDbConnected ? 'healthy' : 'unhealthy',
    database: {
      connected: isDbConnected,
      readyState: mongoose.connection.readyState,
    },
    environment: process.env.NODE_ENV || 'development',
    correlationId: req.correlationId,
    timestamp: new Date().toISOString(),
  });
});

// 9. 404 Route Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found`,
    correlationId: req.correlationId,
  });
});

// 10. Centralized Production-Hardened Error Handling Middleware
app.use((err, req, res, next) => {
  const correlationId = req.correlationId || 'unknown';

  // Handle Malformed JSON payload
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON payload in request body.',
      correlationId,
    });
  }

  // Handle Mongoose Invalid ObjectId (CastError)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid identifier format for '${err.path}'.`,
      correlationId,
    });
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'resource';
    return res.status(409).json({
      success: false,
      message: `Duplicate entry conflict: A record with this ${field} already exists.`,
      correlationId,
    });
  }

  // Handle Mongoose Schema Validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', '),
      errors: messages,
      correlationId,
    });
  }

  // Handle JWT token authentication errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid session token. Please log in again.',
      correlationId,
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Your session has expired. Please refresh your session.',
      correlationId,
    });
  }

  // CORS error handler
  if (err.message && err.message.includes('Blocked by CORS policy')) {
    return res.status(403).json({
      success: false,
      message: err.message,
      correlationId,
    });
  }

  // Default Catch-All: never leak internal stack traces in production
  const statusCode = err.status || 500;
  if (req.log) {
    req.log.error({ err, correlationId, statusCode }, `Unhandled Error: ${err.message}`);
  } else {
    logger.error({ err, correlationId, statusCode }, `Unhandled Error: ${err.message}`);
  }

  if (process.env.SENTRY_DSN && statusCode >= 500) {
    Sentry.captureException(err);
  }

  res.status(statusCode).json({
    success: false,
    message: isProd && statusCode === 500 ? 'Internal Server Error' : err.message || 'Internal Server Error',
    correlationId,
    ...(isProd ? {} : { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    logger.info(`CareFlow API server running on port ${PORT} (${process.env.NODE_ENV || 'development'} mode)`);
    startMedicationReminderJob();
  });
}

module.exports = app;
module.exports.server = server;
