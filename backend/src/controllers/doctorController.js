const asyncHandler = require('../utils/asyncHandler');
const Doctor = require('../models/Doctor');
const User = require('../models/User');

const getDoctors = asyncHandler(async (req, res) => {
  const { specialization, search, page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  // Query: Must be verified and active
  const query = { 
    verified: true,
    status: 'active'
  };

  if (specialization && specialization !== 'all') {
    query.specialization = { $regex: specialization, $options: 'i' };
  }

  // Handle Search Server-side
  if (search) {
    // 1. Find users whose name matches search
    const matchingUsers = await User.find({
      name: { $regex: search, $options: 'i' }
    }).select('_id');
    const userIds = matchingUsers.map(u => u._id);

    // 2. Add to doctor query
    query.$or = [
      { userId: { $in: userIds } },
      { specialization: { $regex: search, $options: 'i' } },
      { businessName: { $regex: search, $options: 'i' } }
    ];
  }

  const total = await Doctor.countDocuments(query);
  const doctors = await Doctor.find(query)
    .populate('userId', 'name email avatar phone')
    .sort({ rating: -1, createdAt: -1 })
    .skip(Number(skip))
    .limit(Number(limit))
    .lean();

  res.json({ 
    success: true, 
    data: doctors, 
    pagination: { 
      total, 
      page: Number(page), 
      limit: Number(limit),
      pages: Math.ceil(total / limit)
    } 
  });
});

const getSpecializations = asyncHandler(async (req, res) => {
  const specializations = await Doctor.distinct('specialization', { verified: true, status: 'active' });
  res.json({ success: true, data: specializations });
});

const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id).populate('userId', 'name email avatar phone');
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor not found');
  }
  res.json({ success: true, data: doctor });
});

const updateDoctorProfile = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ userId: req.user.id });
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  const { name, phone, avatar, ...doctorFields } = req.body;

  // Update User fields if provided
  if (name || phone || avatar) {
    const userUpdate = {};
    if (name) userUpdate.name = name;
    if (phone) userUpdate.phone = phone;
    if (avatar) userUpdate.avatar = avatar;
    await User.findByIdAndUpdate(req.user.id, userUpdate);
  }

  // Update Doctor fields
  const updatedDoctor = await Doctor.findOneAndUpdate(
    { userId: req.user.id },
    doctorFields,
    { returnDocument: 'after' }
  ).populate('userId', 'name email phone avatar');

  res.json({ success: true, data: updatedDoctor });
});

module.exports = { getDoctors, getDoctorById, updateDoctorProfile, getSpecializations };
