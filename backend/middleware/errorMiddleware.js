/**
 * Custom error handler for handling 404 routes
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Global error handler middleware
 * Handles all errors and sends consistent response format
 */
const errorHandler = (err, req, res, next) => {
  // Set status code
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode);

  // Send error response
  res.json({
    success: false,
    message: err.message,
    // Only show stack trace in development
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
    // Additional error details
    errors: err.errors || null,
  });

  // Log error in production
  if (process.env.NODE_ENV === 'production') {
    console.error('Error:', {
      message: err.message,
      statusCode,
      path: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Validation error formatter
 */
const validationErrorFormatter = (errors) => {
  return errors.array().map((error) => ({
    field: error.param,
    message: error.msg,
  }));
};

module.exports = {
  notFound,
  errorHandler,
  validationErrorFormatter,
};