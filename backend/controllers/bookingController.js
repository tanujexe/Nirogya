const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');
const Doctor = require('../models/Doctor');

/**
 * @desc    Create a new booking
 * @route   POST /api/bookings
 * @access  Private
 */
const createBooking = asyncHandler(async (req, res) => {
  const { doctor, appointmentDate, timeSlot, reason } = req.body;

  // Check if doctor exists
  const doctorDoc = await Doctor.findById(doctor);

  if (!doctorDoc || !doctorDoc.isActive) {
    res.status(404);
    throw new Error('Doctor not found or inactive');
  }

  // Check if the slot is already booked
  const existingBooking = await Booking.findOne({
    doctor,
    appointmentDate: new Date(appointmentDate),
    timeSlot,
    status: { $in: ['Pending', 'Confirmed'] },
  });

  if (existingBooking) {
    res.status(400);
    throw new Error('This time slot is already booked');
  }

  // Create booking
  const booking = await Booking.create({
    user: req.user._id,
    doctor,
    appointmentDate: new Date(appointmentDate),
    timeSlot,
    reason,
    amount: doctorDoc.fees,
  });

  // Populate doctor details
  await booking.populate('doctor', 'name specialization hospital fees');

  res.status(201).json({
    success: true,
    data: booking,
    message: 'Booking created successfully',
  });
});

/**
 * @desc    Get all bookings for logged-in user
 * @route   GET /api/bookings
 * @access  Private
 */
const getUserBookings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  // Build query
  let query = {};
  if (req.user.role === 'doctor') {
    query.doctor = req.user._id;
  } else if (req.user.role === 'admin') {
    // Admin sees everything
  } else {
    query.user = req.user._id;
  }

  if (status) {
    query.status = status;
  }

  // Execute query with pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const bookings = await Booking.find(query)
    .populate('doctor', 'name specialization hospital fees profileImage')
    .populate('user', 'name email phone')
    .sort({ appointmentDate: -1 })
    .limit(parseInt(limit))
    .skip(skip);

  const total = await Booking.countDocuments(query);

  res.json({
    success: true,
    data: bookings,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

/**
 * @desc    Get single booking by ID
 * @route   GET /api/bookings/:id
 * @access  Private
 */
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('doctor', 'name specialization hospital fees profileImage phone')
    .populate('user', 'name email phone');

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  // Check if user owns this booking or is admin
  if (
    booking.user._id.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to access this booking');
  }

  res.json({
    success: true,
    data: booking,
  });
});

/**
 * @desc    Update booking status
 * @route   PUT /api/bookings/:id/status
 * @access  Private
 */
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  // Check authorization: user who booked, the doctor assigned, or admin
  if (
    booking.user.toString() !== req.user._id.toString() &&
    booking.doctor.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to update this booking');
  }

  booking.status = status;
  await booking.save();

  res.json({
    success: true,
    data: booking,
    message: 'Booking status updated successfully',
  });
});

/**
 * @desc    Cancel booking
 * @route   PUT /api/bookings/:id/cancel
 * @access  Private
 */
const cancelBooking = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  // Check authorization: user who booked, the doctor assigned, or admin
  if (
    booking.user.toString() !== req.user._id.toString() &&
    booking.doctor.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to cancel this booking');
  }

  // Can only cancel pending or confirmed bookings
  if (!['Pending', 'Confirmed'].includes(booking.status)) {
    res.status(400);
    throw new Error('Cannot cancel this booking');
  }

  booking.status = 'Cancelled';
  booking.cancelReason = reason;
  booking.cancelledBy = req.user.role;
  booking.cancelledAt = new Date();

  await booking.save();

  res.json({
    success: true,
    data: booking,
    message: 'Booking cancelled successfully',
  });
});

/**
 * @desc    Get upcoming bookings
 * @route   GET /api/bookings/upcoming
 * @access  Private
 */
const getUpcomingBookings = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let query = {
    appointmentDate: { $gte: today },
    status: { $in: ['Pending', 'Confirmed'] },
  };

  if (req.user.role === 'doctor') {
    query.doctor = req.user._id;
  } else {
    query.user = req.user._id;
  }

  const bookings = await Booking.find(query)
    .populate('doctor', 'name specialization hospital fees profileImage')
    .populate('user', 'name email phone')
    .sort({ appointmentDate: 1 })
    .limit(5);

  res.json({
    success: true,
    data: bookings,
  });
});

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  getUpcomingBookings,
};