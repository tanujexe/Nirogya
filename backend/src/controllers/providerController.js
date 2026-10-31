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
  const { search } = req.query;
  let Model;

  switch (type) {
    case 'doctor': Model = Doctor; break;
    case 'ambulance': Model = AmbulanceProvider; break;
    case 'bloodbank': Model = BloodBankProvider; break;
    case 'lab': Model = LabProvider; break;
    default:
      res.status(400);
      throw new Error('Invalid provider type');
  }

  // Filter: Must be verified and active
  const query = { 
    verified: true,
    status: 'active'
  };

  if (search) {
    query.$or = [
      { businessName: { $regex: search, $options: 'i' } },
      { city: { $regex: search, $options: 'i' } },
      { state: { $regex: search, $options: 'i' } }
    ];
  }

  const providers = await Model.find(query).populate('userId', 'name avatar');
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
    default: 
      return res.json({ success: true, data: null });
  }
  const profile = await Model.findOne({ userId }).populate('userId', 'name email phone avatar');
  res.json({ success: true, data: profile });
});

const updateMyProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;
  
  // Protect sensitive fields and extract identity fields
  const { 
    name, phone, avatar,
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
    default: 
      res.status(403); 
      throw new Error('Unauthorized: You do not have a provider role to update.');
  }

  // Update User fields if provided
  if (name || phone || avatar) {
    const userUpdate = {};
    if (name) userUpdate.name = name;
    if (phone) userUpdate.phone = phone;
    if (avatar) userUpdate.avatar = avatar;
    await User.findByIdAndUpdate(userId, userUpdate);
    
    // Also add phone to provider update if it's provided
    if (phone) updateData.phone = phone;
  }

  const profile = await Model.findOneAndUpdate(
    { userId }, 
    { $set: updateData }, 
    { returnDocument: 'after', runValidators: true }
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

