const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const isDev = (env.NODE_ENV || process.env.NODE_ENV || 'development') === 'development';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 1000 : 25,
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
  skip: () => isDev,
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 1500, // Generous limit suitable for rich SPA interactions
  message: 'Too many requests from this IP, please try again after 15 minutes',
  skip: (req) => {
    // In development mode, skip rate limiting to avoid blocking tests/demos
    if (isDev) return true;
    // Never throttle emergency ambulance endpoints
    if (req.originalUrl?.includes('/ambulance') || req.path?.includes('/ambulance')) return true;
    return false;
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, apiLimiter };
