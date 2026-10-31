const express = require('express');
const { getLabs, getLabById, bookTest, updateLabBookingStatus } = require('../controllers/labController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/',          getLabs);
router.get('/:id',       getLabById);
router.post('/book-test', protect, bookTest);
router.patch('/bookings/:id/status', protect, authorize('admin', 'lab'), updateLabBookingStatus);

module.exports = router;
