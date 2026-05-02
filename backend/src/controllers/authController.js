const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const generateToken = require('../utils/generateToken');

const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role, ...doctorData } = req.body;
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    name, email, password, phone, role: role || 'user'
  });

  if (role === 'doctor') {
    await Doctor.create({
      userId: user._id,
      ...doctorData,
      licenseNumber: doctorData.licenseNumber || 'PENDING'
    });
  }

  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: generateToken(user._id, user.role),
    }
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        token: generateToken(user._id, user.role),
      }
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  let data = user.toObject();
  
  if (user.role === 'doctor') {
    const doctor = await Doctor.findOne({ userId: user._id });
    if (doctor) data.doctorProfile = doctor;
  }

  res.json({ success: true, data });
});

const forgotPassword = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Forgot password route placeholder' });
});

const resetPassword = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Reset password route placeholder' });
});

module.exports = { register, login, getMe, forgotPassword, resetPassword };
