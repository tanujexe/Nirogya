const asyncHandler = require('../utils/asyncHandler');
const Review = require('../models/Review');
const Doctor = require('../models/Doctor');
const Booking = require('../models/Booking');

// ── ADD REVIEW ────────────────────────────────────────────────────────────────
const addReview = asyncHandler(async (req, res) => {
  const { doctorId, bookingId, rating, comment } = req.body;

  if (!doctorId || !bookingId || !rating) {
    res.status(400);
    throw new Error('doctorId, bookingId, and rating are required');
  }

  // Verify the booking belongs to this user and is completed
  const booking = await Booking.findOne({
    _id:      bookingId,
    userId:   req.user.id,
    providerId: doctorId,
    type:     'doctor',
    status:   'completed',
  });

  if (!booking) {
    res.status(403);
    throw new Error('You can only review doctors after a completed appointment');
  }

  // Check for duplicate review on this booking
  const existing = await Review.findOne({ bookingId });
  if (existing) {
    res.status(400);
    throw new Error('You have already submitted a review for this appointment');
  }

  const review = await Review.create({
    doctorId,
    userId:   req.user.id,
    bookingId,
    rating:   Number(rating),
    comment,
  });

  // Doctor rating is auto-updated via post-save hook on Review model
  const populated = await Review.findById(review._id).populate('userId', 'name avatar');
  res.status(201).json({ success: true, data: populated });
});

// ── GET REVIEWS FOR A DOCTOR ───────────────────────────────────────────────────
const getDoctorReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const doctorId = req.params.doctorId;
  const total = await Review.countDocuments({ doctorId });
  const reviews = await Review.find({ doctorId })
    .populate('userId', 'name avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  res.json({ success: true, data: reviews, total, page: Number(page) });
});

// ── DELETE REVIEW (admin or owner) ────────────────────────────────────────────
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  const isOwner = review.userId.toString() === req.user.id;
  if (!isOwner && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete this review');
  }

  await review.deleteOne();
  // Doctor rating is auto-recalculated via post-deleteOne hook on Review model
  res.json({ success: true, message: 'Review deleted successfully' });
});

module.exports = { addReview, getDoctorReviews, deleteReview };
