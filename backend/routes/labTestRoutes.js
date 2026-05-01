const express = require('express');
const router = express.Router();
const {
  getLabTests,
  getLabTestById,
  createLabBooking,
  getUserLabBookings,
  getLabBookingById,
  uploadLabReport,
  cancelLabBooking,
  createLabTest,
} = require('../controllers/labTestController');
const { protect, admin } = require('../middleware/authMiddleware');
const { uploadLabReport: upload } = require('../utils/cloudinary');

// Public routes
router.get('/', getLabTests);
router.get('/:id', getLabTestById);

// Protected routes
router.post('/bookings', protect, createLabBooking);
router.get('/bookings', protect, getUserLabBookings);
router.get('/bookings/:id', protect, getLabBookingById);
router.put('/bookings/:id/cancel', protect, cancelLabBooking);

// Admin routes
router.post('/', protect, admin, createLabTest);
router.put('/bookings/:id/report', protect, admin, upload.single('report'), uploadLabReport);

module.exports = router;