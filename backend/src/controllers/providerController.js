const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const AmbulanceProvider = require('../models/AmbulanceProvider');
const BloodBankProvider = require('../models/BloodBankProvider');
const LabProvider = require('../models/LabProvider');

// @desc    Apply as a provider
// @route   POST /api/providers/apply
// @access  Private
const applyAsProvider = asyncHandler(async (req, res) => {
  const { type, ...formData } = req.body;
  const userId = req.user.id;

  // Check if already applied
  const existingUser = await User.findById(userId);
  if (existingUser.role !== 'user') {
    res.status(400);
    throw new Error('User already has a provider role or pending application');
  }

  let profile;
  switch (type) {
    case 'doctor':
      profile = await Doctor.create({ userId, ...formData });
      break;
    case 'ambulance':
      profile = await AmbulanceProvider.create({ userId, ...formData });
      break;
    case 'bloodbank':
      profile = await BloodBankProvider.create({ userId, ...formData });
      break;
    case 'lab':
      profile = await LabProvider.create({ userId, ...formData });
      break;
    default:
      res.status(400);
      throw new Error('Invalid provider type');
  }

  // Update user status to pending
  existingUser.status = 'pending';
  await existingUser.save();

  res.status(201).json({
    success: true,
    message: 'Application submitted successfully. It is now under review.',
    data: profile
  });
});

// @desc    Get all providers by type (Public)
// @route   GET /api/providers/:type
// @access  Public
const getProvidersByType = asyncHandler(async (req, res) => {
  const { type } = req.params;
  let providers;

  switch (type) {
    case 'doctor':
      providers = await Doctor.find({ status: 'active' }).populate('userId', 'name avatar');
      break;
    case 'ambulance':
      providers = await AmbulanceProvider.find({ status: 'active' }).populate('userId', 'name avatar');
      break;
    case 'bloodbank':
      providers = await BloodBankProvider.find({ status: 'active' }).populate('userId', 'name avatar');
      break;
    case 'lab':
      providers = await LabProvider.find({ status: 'active' }).populate('userId', 'name avatar');
      break;
    default:
      res.status(400);
      throw new Error('Invalid provider type');
  }

  res.json({ success: true, data: providers });
});

// @desc    Get provider profile by ID (Public)
// @route   GET /api/providers/:type/:id
// @access  Public
const getProviderById = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  let profile;

  switch (type) {
    case 'doctor':
      profile = await Doctor.findById(id).populate('userId', 'name avatar email phone');
      break;
    case 'ambulance':
      profile = await AmbulanceProvider.findById(id).populate('userId', 'name avatar email phone');
      break;
    case 'bloodbank':
      profile = await BloodBankProvider.findById(id).populate('userId', 'name avatar email phone');
      break;
    case 'lab':
      profile = await LabProvider.findById(id).populate('userId', 'name avatar email phone');
      break;
    default:
      res.status(400);
      throw new Error('Invalid provider type');
  }

  if (!profile) {
    res.status(404);
    throw new Error('Provider not found');
  }

  res.json({ success: true, data: profile });
});

module.exports = {
  applyAsProvider,
  getProvidersByType,
  getProviderById
};
