const { Server } = require('socket.io');
const { verifyUserToken } = require('../middleware/auth.middleware');
const logger = require('../config/logger');

let io = null;

/**
 * Extracts JWT token from socket handshake headers/cookies/auth
 */
function extractSocketToken(handshake) {
  if (handshake.auth && handshake.auth.token) {
    return handshake.auth.token;
  }

  if (handshake.headers && handshake.headers.authorization && handshake.headers.authorization.startsWith('Bearer ')) {
    return handshake.headers.authorization.split(' ')[1];
  }

  if (handshake.headers && handshake.headers.cookie) {
    const rawCookies = handshake.headers.cookie.split(';');
    for (const cookie of rawCookies) {
      const [key, value] = cookie.trim().split('=');
      if (key === 'token') {
        return decodeURIComponent(value);
      }
    }
  }

  return null;
}

/**
 * Initializes Socket.IO attached to HTTP server
 */
function initSocket(server) {
  if (io) return io;

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

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const normalized = origin.trim().replace(/\/$/, '');
        if (allowedOrigins.includes(normalized)) {
          return callback(null, true);
        }
        return callback(null, true); // Fallback for transport connections
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication Handshake Middleware
  io.use(async (socket, next) => {
    try {
      const token = extractSocketToken(socket.handshake);
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const user = await verifyUserToken(token);
      if (!user) {
        return next(new Error('User not found or invalid session'));
      }

      socket.user = user;
      next();
    } catch (err) {
      logger.debug({ err: err.message }, 'Socket.IO handshake authentication rejected');
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user?._id?.toString();
    const userRole = socket.user?.role;

    if (userId) {
      socket.join(`user:${userId}`);
    }
    if (userRole) {
      socket.join(`role:${userRole}`);
    }

    logger.debug({ userId, role: userRole, socketId: socket.id }, 'User connected to real-time socket');

    socket.on('disconnect', (reason) => {
      logger.debug({ userId, socketId: socket.id, reason }, 'User disconnected from real-time socket');
    });
  });

  return io;
}

/**
 * Emits an event to a specific user's private room
 */
function emitToUser(userId, event, data) {
  if (!io || !userId) return;
  const targetId = userId._id ? userId._id.toString() : userId.toString();
  io.to(`user:${targetId}`).emit(event, data);
}

/**
 * Emits a standardized in-app notification to a user
 */
function emitNotification(userId, notification) {
  if (!io || !userId) return;
  const targetId = userId._id ? userId._id.toString() : userId.toString();
  const payload = {
    id: notification._id || notification.id || `notif_${Date.now()}`,
    type: notification.type || 'system',
    title: notification.title || 'CareFlow Notification',
    message: notification.message || '',
    variant:
      notification.type === 'appointment_cancelled'
        ? 'warning'
        : notification.type === 'appointment_confirmed'
        ? 'success'
        : notification.type === 'prescription_ready'
        ? 'success'
        : notification.type === 'medication_reminder'
        ? 'warning'
        : 'info',
    timestamp: new Date().toISOString(),
    ...notification,
  };

  io.to(`user:${targetId}`).emit('notification', payload);
  if (notification.type) {
    io.to(`user:${targetId}`).emit(notification.type, payload);
  }
}

/**
 * Emits an event to all users with a specific role
 */
function emitToRole(role, event, data) {
  if (!io || !role) return;
  io.to(`role:${role}`).emit(event, data);
}

/**
 * Returns current Socket.IO instance
 */
function getIO() {
  return io;
}

module.exports = {
  initSocket,
  emitToUser,
  emitNotification,
  emitToRole,
  getIO,
};
