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

  // Check user role and status
  const existingUser = await User.findById(userId);
  if (!existingUser) { res.status(404); throw new Error('User not found'); }

  if (existingUser.role !== 'user') {
    res.status(400);
    throw new Error(`You are already registered as a ${existingUser.role}. One account can only have one provider role.`);
  }

  if (existingUser.status === 'pending') {
    res.status(400);
    throw new Error('You already have a pending application. Please wait for admin review.');
  }

  // Double check all collections to ensure no "ghost" pending applications exist
  const [doc, amb, blood, lab] = await Promise.all([
    Doctor.findOne({ userId, status: 'pending' }),
    AmbulanceProvider.findOne({ userId, status: 'pending' }),
    BloodBankProvider.findOne({ userId, status: 'pending' }),
    LabProvider.findOne({ userId, status: 'pending' })
  ]);

  if (doc || amb || blood || lab) {
    // Sync user status if it was somehow out of sync
    existingUser.status = 'pending';
    await existingUser.save();
    res.status(400);
    throw new Error('An active application was found for your account. Multiple requests are not allowed.');
  }

  // If there's a rejected application, we might want to delete it or update it?
  // For simplicity, let's just delete any non-active records for this user in this type
  // so they can start fresh, or just error out. 
  // User requested "one request at a time", so if they are rejected, they should be able to try again.
  await Promise.all([
    Doctor.deleteOne({ userId, status: { $ne: 'active' } }),
    AmbulanceProvider.deleteOne({ userId, status: { $ne: 'active' } }),
    BloodBankProvider.deleteOne({ userId, status: { $ne: 'active' } }),
    LabProvider.deleteOne({ userId, status: { $ne: 'active' } })
  ]);

  let profile;
  switch (type) {
    case 'doctor':
      profile = await Doctor.create({ userId, ...formData, status: 'pending' });
      break;
    case 'ambulance':
      profile = await AmbulanceProvider.create({ userId, ...formData, status: 'pending' });
      break;
    case 'bloodbank':
      profile = await BloodBankProvider.create({ userId, ...formData, status: 'pending' });
      break;
    case 'lab':
      profile = await LabProvider.create({ userId, ...formData, status: 'pending' });
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

const getMyProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;
  let Model;
  switch (role) {
    case 'doctor': Model = Doctor; break;
    case 'ambulance': Model = AmbulanceProvider; break;
    case 'bloodbank': Model = BloodBankProvider; break;
    case 'lab': Model = LabProvider; break;
    default: res.status(400); throw new Error('Not a provider role');
  }
  const profile = await Model.findOne({ userId }).populate('userId', 'name email phone avatar');
  res.json({ success: true, data: profile });
});

const updateMyProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;
  
  // Protect sensitive fields - they can only be changed by Admin
  const { 
    licenseNumber, verified, status, 
    userId: _uid, _id, createdAt, updatedAt, __v,
    hasVerifiedBadge, hasServicesBadge,
    ...updateData 
  } = req.body;
  
  let Model;
  switch (role) {
    case 'doctor': Model = Doctor; break;
    case 'ambulance': Model = AmbulanceProvider; break;
    case 'bloodbank': Model = BloodBankProvider; break;
    case 'lab': Model = LabProvider; break;
    default: res.status(400); throw new Error('Not a provider role');
  }

  const profile = await Model.findOneAndUpdate(
    { userId }, 
    { $set: updateData }, 
    { new: true, runValidators: true }
  ).populate('userId', 'name email phone avatar');

  if (!profile) {
    res.status(404);
    throw new Error('Profile not found');
  }

  res.json({ success: true, data: profile });
});

module.exports = {
  applyAsProvider,
  getProvidersByType,
  getProviderById,
  getMyProfile,
  updateMyProfile
};

