const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
// require("dotenv").config();

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize express app
const app = express();
console.log("ENV CHECK:", process.env.MONGO_URI);
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security Headers
app.use(helmet());

// Rate Limiting (100 requests per 15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use('/api/', apiLimiter);

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Health check route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'NirogySathi API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      doctors: '/api/doctors',
      bookings: '/api/bookings',
      healthRecords: '/api/health-records',
      labTests: '/api/lab-tests',
    },
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/health-records', require('./routes/healthRecordRoutes'));
app.use('/api/lab-tests', require('./routes/labTestRoutes'));

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║     🏥 NirogySathi API Server Running          ║
║     📍 http://localhost:${PORT}                    ║
║     🌍 Environment: ${process.env.NODE_ENV || 'development'}              ║
║     ⚡ Status: Active                           ║
╚════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`❌ Unhandled Rejection: ${err.message}`);
});

module.exports = app;