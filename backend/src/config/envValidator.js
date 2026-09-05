const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long for production security'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters long').optional(),
  CLIENT_URL: z.string().optional(),
  FRONTEND_URL: z.string().optional(),
  ALLOWED_ORIGINS: z.string().optional(),
  TRUSTED_ORIGINS: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  AI_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().default('gemini-flash-latest'),
  COOKIE_SAME_SITE: z.enum(['lax', 'none', 'strict']).optional(),
  COOKIE_SECURE: z.enum(['true', 'false']).optional(),
});

function validateEnv() {
  const isProduction = process.env.NODE_ENV === 'production';

  // In development/test, provide default test JWT secret if not configured
  if (!isProduction && !process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'super_secret_jwt_key_careflow_min_32_chars_long';
    console.warn('⚠️ [DEV WARNING] JWT_SECRET not provided. Using development fallback secret.');
  }

  if (!isProduction && !process.env.JWT_REFRESH_SECRET) {
    process.env.JWT_REFRESH_SECRET = (process.env.JWT_SECRET || '') + '_refresh_token_secret_key_32_chars';
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('\n=============================================================');
    console.error('❌ FATAL STARTUP ERROR: Invalid / Missing Environment Variables');
    console.error('=============================================================');
    for (const issue of result.error.issues) {
      console.error(`- ${issue.path.join('.')}: ${issue.message}`);
    }
    console.error('=============================================================\n');

    if (isProduction) {
      console.error('Server cannot start in production with invalid environment variables. Exiting.');
      process.exit(1);
    }
  }

  // Additional Production Strictness Checks
  if (isProduction) {
    const insecurePlaceholders = [
      'super_secret_jwt_key_careflow_min_32_chars_long',
      'your_super_secret_jwt_signing_key_min_32_chars_long',
      'changeme',
      'secret',
    ];

    if (insecurePlaceholders.includes(process.env.JWT_SECRET)) {
      console.error('❌ FATAL: Insecure placeholder JWT_SECRET detected in production! Set a custom 32+ character key.');
      process.exit(1);
    }

    const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || process.env.ALLOWED_ORIGINS;
    if (!frontendUrl) {
      console.error('❌ FATAL: FRONTEND_URL or CLIENT_URL is required in production for CORS & Cookie security.');
      process.exit(1);
    }
  }

  return result.data || process.env;
}

module.exports = {
  validateEnv,
};
