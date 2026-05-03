const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { createBooking, getMyBookings, getUpcomingBookings, getBookingById, cancelBooking, updateBookingStatus } = require('../controllers/bookingController');

const router = express.Router();

router.use(protect);
router.post('/', createBooking);
router.get('/upcoming', getUpcomingBookings);  // MUST be before /:id
router.get('/my', getMyBookings);
router.get('/:id', getBookingById);
router.put('/:id/cancel', cancelBooking);
router.put('/:id/status', updateBookingStatus);
router.patch('/:id/cancel', cancelBooking);
router.patch('/:id/status', updateBookingStatus);

module.exports = router;
