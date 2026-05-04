const asyncHandler = require('../utils/asyncHandler');
const Review = require('../models/Review');
const Doctor = require('../models/Doctor');

const addReview = asyncHandler(async (req, res) => {
  const { doctorId, rating, comment } = req.body;
  const review = await Review.create({
    userId: req.user.id,
    doctorId,
    rating,
    comment
  });

  // Update doctor rating
  const reviews = await Review.find({ doctorId });
  const avgRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;
  
  await Doctor.findByIdAndUpdate(doctorId, {
    rating: avgRating,
    reviewsCount: reviews.length
  });

  res.status(201).json({ success: true, data: review });
});

const getDoctorReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ doctorId: req.params.doctorId }).populate('userId', 'name avatar');
  res.json({ success: true, data: reviews });
});

module.exports = { addReview, getDoctorReviews };
