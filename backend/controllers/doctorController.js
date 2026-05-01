const asyncHandler = require('express-async-handler');
const Doctor = require('../models/Doctor');

/**
 * @desc    Get all active doctors
 * @route   GET /api/doctors
 * @access  Public
 */
const getDoctors = asyncHandler(async (req, res) => {
  const { specialization, search, sort, page = 1, limit = 12 } = req.query;

  // Build query
  let query = {};
  
  // If not admin, only show active doctors
  if (!req.user || req.user.role !== 'admin') {
    query.isActive = true;
  }

  // Filter by specialization
  if (specialization && specialization !== 'All') {
    query.specialization = specialization;
  }

  // Search by name or hospital
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { 'hospital.name': { $regex: search, $options: 'i' } },
      { 'hospital.city': { $regex: search, $options: 'i' } },
    ];
  }

  // Build sort options
  let sortOptions = {};
  switch (sort) {
    case 'rating':
      sortOptions = { rating: -1 };
      break;
    case 'experience':
      sortOptions = { experience: -1 };
      break;
    case 'fees-low':
      sortOptions = { fees: 1 };
      break;
    case 'fees-high':
      sortOptions = { fees: -1 };
      break;
    default:
      sortOptions = { rating: -1, experience: -1 };
  }

  // Execute query with pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const doctors = await Doctor.find(query)
    .sort(sortOptions)
    .limit(parseInt(limit))
    .skip(skip);

  const total = await Doctor.countDocuments(query);

  res.json({
    success: true,
    data: doctors,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

/**
 * @desc    Get single doctor by ID
 * @route   GET /api/doctors/:id
 * @access  Public
 */
const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);

  if (doctor && doctor.isActive) {
    res.json({
      success: true,
      data: doctor,
    });
  } else {
    res.status(404);
    throw new Error('Doctor not found');
  }
});

/**
 * @desc    Get doctor availability for a specific date
 * @route   GET /api/doctors/:id/availability
 * @access  Public
 */
const getDoctorAvailability = asyncHandler(async (req, res) => {
  const { date } = req.query;

  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    res.status(404);
    throw new Error('Doctor not found');
  }

  // Get day of week from date
  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'lowercase' });

  const availability = doctor.availability[dayOfWeek];

  if (!availability || !availability.available) {
    return res.json({
      success: true,
      data: {
        available: false,
        slots: [],
      },
    });
  }

  // TODO: Filter out already booked slots by checking Booking model
  // For now, return all available slots

  res.json({
    success: true,
    data: {
      available: true,
      slots: availability.slots || [],
    },
  });
});

/**
 * @desc    Create a new doctor (Admin only)
 * @route   POST /api/doctors
 * @access  Private/Admin
 */
const createDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.create(req.body);

  res.status(201).json({
    success: true,
    data: doctor,
    message: 'Doctor created successfully',
  });
});

/**
 * @desc    Update doctor
 * @route   PUT /api/doctors/:id
 * @access  Private/Admin
 */
const updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    res.status(404);
    throw new Error('Doctor not found');
  }

  const updatedDoctor = await Doctor.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    data: updatedDoctor,
    message: 'Doctor updated successfully',
  });
});

/**
 * @desc    Delete doctor (soft delete)
 * @route   DELETE /api/doctors/:id
 * @access  Private/Admin
 */
const deleteDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    res.status(404);
    throw new Error('Doctor not found');
  }

  // Soft delete
  doctor.isActive = false;
  await doctor.save();

  res.json({
    success: true,
    message: 'Doctor deleted successfully',
  });
});

/**
 * @desc    Get all specializations
 * @route   GET /api/doctors/specializations
 * @access  Public
 */
const getSpecializations = asyncHandler(async (req, res) => {
  const specializations = await Doctor.distinct('specialization', { isActive: true });

  res.json({
    success: true,
    data: specializations,
  });
});

module.exports = {
  getDoctors,
  getDoctorById,
  getDoctorAvailability,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getSpecializations,
};