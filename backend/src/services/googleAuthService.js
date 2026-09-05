const { OAuth2Client } = require('google-auth-library');

const getOAuthClient = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID is not configured on the server.');
  }
  return new OAuth2Client(clientId);
};

/**
 * Verify a Google ID token from Google Identity Services (GIS)
 * @param {string} idToken - Signed JWT from Google client
 * @returns {Promise<{ googleId: string, email: string, name: string, avatarUrl: string, emailVerified: boolean }>}
 */
async function verifyGoogleIdToken(idToken) {
  if (!idToken) {
    throw new Error('Google ID token is required.');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const client = getOAuthClient();

  const ticket = await client.verifyIdToken({
    idToken,
    audience: clientId,
  });

  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error('Failed to verify Google token: empty payload received.');
  }

  if (!payload.email_verified) {
    throw new Error('Google account email is not verified.');
  }

  return {
    googleId: payload.sub,
    email: (payload.email || '').toLowerCase().trim(),
    name: payload.name || payload.given_name || 'CareFlow Patient',
    avatarUrl: payload.picture || '',
    emailVerified: Boolean(payload.email_verified),
  };
}

module.exports = {
  verifyGoogleIdToken,
};
