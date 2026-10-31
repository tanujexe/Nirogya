require('dotenv').config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET || 'secret',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '30d',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@nirogya.com',
  GROQ_API_KEY: process.env.GROQ_API_KEY,
};

// ── Validation (Production Safety) ───────────────────────────────────────────
const required = ['MONGO_URI', 'JWT_SECRET'];
if (env.NODE_ENV === 'production') {
  required.push('CLOUDINARY_API_KEY', 'SMTP_USER');
}

const missing = required.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error(`\n[FATAL ERROR] Missing required environment variables: ${missing.join(', ')}`);
  console.error('The application cannot start without these. Please check your .env file.\n');
  if (env.NODE_ENV === 'production') process.exit(1);
}

module.exports = env;
