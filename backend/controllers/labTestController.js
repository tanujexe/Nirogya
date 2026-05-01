const asyncHandler = require('express-async-handler');
const { LabTest, LabBooking } = require('../models/LabTest');

/**
 * @desc    Get all lab tests
 * @route   GET /api/lab-tests
 * @access  Public
 */
const getLabTests = asyncHandler(async (req, res) => {
  const { category, search, page = 1, limit = 12 } = req.query;

  // Build query
  let query = { isActive: true };

  if (category && category !== 'All') {
    query.category = category;
  }

  if (search) {
    query.testName = { $regex: search, $options: 'i' };
  }

  // Execute query with pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const tests = await LabTest.find(query)
    .sort({ testName: 1 })
    .limit(parseInt(limit))
    .skip(skip);

  const total = await LabTest.countDocuments(query);

  res.json({
    success: true,
    data: tests,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

/**
 * @desc    Get single lab test by ID
 * @route   GET /api/lab-tests/:id
 * @access  Public
 */
const getLabTestById = asyncHandler(async (req, res) => {
  const test = await LabTest.findById(req.params.id);

  if (!test || !test.isActive) {
    res.status(404);
    throw new Error('Lab test not found');
  }

  res.json({
    success: true,
    data: test,
  });
});

/**
 * @desc    Create lab test booking
 * @route   POST /api/lab-tests/bookings
 * @access  Private
 */
const createLabBooking = asyncHandler(async (req, res) => {
  const { test, scheduledDate, timeSlot, location, address, notes } = req.body;

  // Check if test exists
  const testDoc = await LabTest.findById(test);

  if (!testDoc || !testDoc.isActive) {
    res.status(404);
    throw new Error('Lab test not found');
  }

  // Create booking
  const booking = await LabBooking.create({
    user: req.user._id,
    test,
    scheduledDate: new Date(scheduledDate),
    timeSlot,
    location,
    address: location === 'Home Collection' ? address : undefined,
    notes,
    amount: testDoc.price,
  });

  // Populate test details
  await booking.populate('test', 'testName category price reportDeliveryTime');

  res.status(201).json({
    success: true,
    data: booking,
    message: 'Lab test booked successfully',
  });
});

/**
 * @desc    Get all lab bookings for logged-in user
 * @route   GET /api/lab-tests/bookings
 * @access  Private
 */
const getUserLabBookings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  // Build query
  let query = { user: req.user._id };

  if (status) {
    query.status = status;
  }

  // Execute query with pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const bookings = await LabBooking.find(query)
    .populate('test', 'testName category price reportDeliveryTime')
    .sort({ scheduledDate: -1 })
    .limit(parseInt(limit))
    .skip(skip);

  const total = await LabBooking.countDocuments(query);

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
 * @desc    Get single lab booking by ID
 * @route   GET /api/lab-tests/bookings/:id
 * @access  Private
 */
const getLabBookingById = asyncHandler(async (req, res) => {
  const booking = await LabBooking.findById(req.params.id)
    .populate('test', 'testName category price reportDeliveryTime preparationRequired')
    .populate('user', 'name email phone');

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  // Check authorization
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
 * @desc    Upload lab report (Admin only)
 * @route   PUT /api/lab-tests/bookings/:id/report
 * @access  Private/Admin
 */
const uploadLabReport = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload a file');
  }

  const booking = await LabBooking.findById(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  // Update booking with report
  booking.reportUrl = req.file.path;
  booking.reportPublicId = req.file.filename;
  booking.reportUploadedAt = new Date();
  booking.status = 'Completed';

  await booking.save();

  res.json({
    success: true,
    data: booking,
    message: 'Lab report uploaded successfully',
  });
});

/**
 * @desc    Cancel lab booking
 * @route   PUT /api/lab-tests/bookings/:id/cancel
 * @access  Private
 */
const cancelLabBooking = asyncHandler(async (req, res) => {
  const booking = await LabBooking.findById(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  // Check authorization
  if (
    booking.user.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to cancel this booking');
  }

  // Can only cancel scheduled bookings
  if (booking.status !== 'Scheduled') {
    res.status(400);
    throw new Error('Cannot cancel this booking');
  }

  booking.status = 'Cancelled';
  await booking.save();

  res.json({
    success: true,
    data: booking,
    message: 'Lab booking cancelled successfully',
  });
});

/**
 * @desc    Create lab test (Admin only)
 * @route   POST /api/lab-tests
 * @access  Private/Admin
 */
const createLabTest = asyncHandler(async (req, res) => {
  const test = await LabTest.create(req.body);

  res.status(201).json({
    success: true,
    data: test,
    message: 'Lab test created successfully',
  });
});

module.exports = {
  getLabTests,
  getLabTestById,
  createLabBooking,
  getUserLabBookings,
  getLabBookingById,
  uploadLabReport,
  cancelLabBooking,
  createLabTest,
};