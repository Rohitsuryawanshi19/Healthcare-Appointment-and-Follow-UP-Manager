const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

const ACCESS_TOKEN_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Returns dynamic cookie configuration based on deployment topology
 */
function getCookieConfig() {
  const isProd = process.env.NODE_ENV === 'production';

  // Cross-domain hosting (Render + Vercel) requires sameSite: 'none' and secure: true
  // Same-domain or local development uses sameSite: 'lax' and secure: false
  const sameSite = process.env.COOKIE_SAME_SITE || (isProd ? 'none' : 'lax');
  const secure = process.env.COOKIE_SECURE !== undefined
    ? process.env.COOKIE_SECURE === 'true'
    : isProd;

  return {
    accessCookie: {
      maxAge: ACCESS_TOKEN_MS,
      httpOnly: true,
      secure,
      sameSite,
      path: '/',
    },
    refreshCookie: {
      maxAge: REFRESH_TOKEN_MS,
      httpOnly: true,
      secure,
      sameSite,
      path: '/api/auth', // Scoped to auth endpoints for reduced surface
    },
  };
}

/**
 * Signs both short-lived access token and long-lived refresh token
 */
function generateTokens(user) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is required but not configured.');
  }

  const refreshSecret =
    process.env.JWT_REFRESH_SECRET || `${jwtSecret}_refresh_secret`;

  const payload = {
    id: user._id || user.id,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, jwtSecret, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  const refreshToken = jwt.sign(
    { id: payload.id, type: 'refresh' },
    refreshSecret,
    {
      expiresIn: REFRESH_TOKEN_EXPIRY,
    }
  );

  return {
    accessToken,
    refreshToken,
  };
}

/**
 * Verifies a refresh token and returns decoded payload
 */
function verifyRefreshToken(token) {
  const jwtSecret = process.env.JWT_SECRET;
  const refreshSecret =
    process.env.JWT_REFRESH_SECRET || `${jwtSecret}_refresh_secret`;

  return jwt.verify(token, refreshSecret);
}

module.exports = {
  getCookieConfig,
  generateTokens,
  verifyRefreshToken,
  ACCESS_TOKEN_MS,
  REFRESH_TOKEN_MS,
};
