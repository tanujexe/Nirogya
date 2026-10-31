const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { addReview, getDoctorReviews, deleteReview } = require('../controllers/reviewController');

const router = express.Router();

router.get('/:doctorId',  getDoctorReviews);           // Public
router.post('/',          protect, addReview);         // Authenticated users only
router.delete('/:id',     protect, deleteReview);      // Owner or admin

module.exports = router;
