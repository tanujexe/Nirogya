const express = require('express');
const router = express.Router();
const { 
  getNearbyAmbulances, 
  createBooking, 
  respondToBooking, 
  updateTripStatus, 
  getBookingDetails,
  getDriverCurrentTrip
} = require('../controllers/ambulanceController');
const { protect } = require('../middleware/authMiddleware');

router.get('/nearby', protect, getNearbyAmbulances);
router.post('/book', protect, createBooking);
router.get('/booking/:id', protect, getBookingDetails);
router.put('/booking/:id/respond', protect, respondToBooking);
router.put('/booking/:id/status', protect, updateTripStatus);
router.get('/driver/current-trip', protect, getDriverCurrentTrip);

module.exports = router;
