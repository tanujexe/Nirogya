const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Accept token from Authorization header OR from query param (for browser direct navigation)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token || token === 'null' || token === 'undefined') {
    res.status(401);
    const err = new Error('Not authorized, no token provided');
    err.name = 'AuthError';
    throw err;
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch (error) {
    res.status(401);
    if (error.name === 'TokenExpiredError') {
      const err = new Error('Session expired. Please log in again.');
      err.name = 'TokenExpiredError';
      throw err;
    }
    const err = new Error('Not authorized, invalid token');
    err.name = 'JsonWebTokenError';
    throw err;
  }

  const user = await User.findById(decoded.id).select('-password');
  if (!user) {
    res.status(401);
    const err = new Error('Not authorized, account no longer exists');
    err.name = 'AuthError';
    throw err;
  }

  req.user = user;
  next();
});

module.exports = { protect };
