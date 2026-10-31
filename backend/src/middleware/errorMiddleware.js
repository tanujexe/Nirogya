const env = require('../config/env');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Something went wrong. Please try again.';
  let errorType = 'UNKNOWN';

  // 1. Mongoose Invalid ObjectId (CastError)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found. Invalid ID format.';
    errorType = 'DB_ERROR';
  }

  // 2. Mongoose Duplicate Key (E11000)
  if (err.code === 11000) {
    statusCode = 400;
    const fields = Object.keys(err.keyValue);
    const firstField = fields[0];
    
    message = `${firstField.charAt(0).toUpperCase() + firstField.slice(1)} already exists.`;
    errorType = 'DB_ERROR';
    
    // Specific business logic friendly messages
    if (fields.includes('email')) message = 'This email is already registered.';
    if (fields.includes('licenseNumber')) message = 'This license number is already in use by another provider.';
    if (fields.includes('userId') && fields.length === 1) message = 'You have already registered or applied as a provider with this account.';
    
    // Double Booking (Compound Index)
    if (fields.includes('providerId') && fields.includes('date') && fields.includes('timeSlot')) {
      message = 'This time slot is already booked. Please choose a different time or date.';
    }
  }

  // 3. Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((val) => val.message).join(', ');
    errorType = 'VALIDATION_ERROR';
  }

  // 4. JWT / Auth Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
    errorType = 'AUTH_ERROR';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Session expired. Please log in again.';
    errorType = 'AUTH_ERROR';
  } else if (statusCode === 401 || err.name === 'AuthError') {
    statusCode = 401;
    errorType = 'AUTH_ERROR';
  }

  // Client errors (401 Unauthorized, 404 Not Found) are expected business flows, not server crashes
  if (statusCode === 401 || statusCode === 404) {
    logger.warn(`[${errorType}] ${statusCode} - ${message} (${req.method} ${req.originalUrl || req.url})`);
  } else {
    // Log full error for 500s and unexpected failures
    logger.error(`[${errorType}] ${statusCode} - ${message} \n ${err.stack}`);
  }

  // In production, mask generic messages to avoid leaking implementation details
  const isDevelopment = env.NODE_ENV === 'development';
  const isFriendlyError = ['VALIDATION_ERROR', 'AUTH_ERROR', 'DB_ERROR'].includes(errorType);

  res.status(statusCode).json({
    success: false,
    message: (isFriendlyError || isDevelopment) ? message : 'An internal server error occurred. Please try again later.',
    errorType: isDevelopment ? errorType : (isFriendlyError ? errorType : 'SERVER_ERROR'),
    ...(isDevelopment && { stack: err.stack, originalError: err.name }),
  });
};

module.exports = { errorHandler };
