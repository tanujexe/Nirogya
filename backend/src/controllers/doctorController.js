const asyncHandler = require('../utils/asyncHandler');
const Doctor = require('../models/Doctor');
const User = require('../models/User');

const getDoctors = asyncHandler(async (req, res) => {
  const { specialization, search, page = 1, limit = 20 } = req.query;
  const query = { verified: true };

  if (specialization && specialization !== 'all') {
    query.specialization = { $regex: specialization, $options: 'i' };
  }

  const skip = (page - 1) * limit;
  let doctorsQuery = Doctor.find(query)
    .populate('userId', 'name email avatar phone')
    .limit(Number(limit))
    .skip(Number(skip))
    .lean();

  const doctors = await doctorsQuery;

  // Client-side search filter (name search requires populated userId)
  const filtered = search
    ? doctors.filter(d =>
        d.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
        d.specialization?.toLowerCase().includes(search.toLowerCase())
      )
    : doctors;

  const total = await Doctor.countDocuments(query);
  res.json({ success: true, data: filtered, pagination: { total, page: Number(page), limit: Number(limit) } });
});

const getSpecializations = asyncHandler(async (req, res) => {
  const specializations = await Doctor.distinct('specialization');
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
    { new: true }
  ).populate('userId', 'name email phone avatar');

  res.json({ success: true, data: updatedDoctor });
});

module.exports = { getDoctors, getDoctorById, updateDoctorProfile, getSpecializations };
