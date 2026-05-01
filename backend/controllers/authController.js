const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { generateToken } = require('../middleware/authMiddleware');
const { validationResult } = require('express-validator');
const { validationErrorFormatter } = require('../middleware/errorMiddleware');
const Doctor = require('../models/Doctor');
/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(JSON.stringify(validationErrorFormatter(errors)));
  }

  const { name, email, password, phone, age, gender, address, role } = req.body;
  const isDoctor = role === 'doctor';
  const Model = isDoctor ? Doctor : User;

  // Check if user already exists
  const userExists = await Model.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error(`${isDoctor ? 'Doctor' : 'User'} already exists with this email`);
  }

  // Create user or doctor
  const user = await Model.create({
    name,
    email,
    password,
    phone,
    age,
    gender,
    address,
    role: isDoctor ? 'doctor' : (role || 'user'),
  });

  if (user) {
    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token: generateToken(user._id, user.role),
      },
      message: `${isDoctor ? 'Doctor' : 'User'} registered successfully`,
    });
  } else {
    res.status(400);
    throw new Error(`Invalid ${isDoctor ? 'doctor' : 'user'} data`);
  }
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(JSON.stringify(validationErrorFormatter(errors)));
  }

  const { email, password, role } = req.body;
  const isDoctor = role === 'doctor';
  const Model = isDoctor ? Doctor : User;

  const user = await Model.findOne({ email }).select('+password');

  if (user && (await user.matchPassword(password))) {
    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token: generateToken(user._id, user.role),
      },
      message: 'Login successful',
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
  const Model = req.user.role === 'doctor' ? Doctor : User;
  const user = await Model.findById(req.user._id);

  if (user) {
    res.json({
      success: true,
      data: user,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const Model = req.user.role === 'doctor' ? Doctor : User;
  const user = await Model.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    user.age = req.body.age || user.age;
    user.gender = req.body.gender || user.gender;
    
    if (req.body.address) {
      user.address = {
        ...user.address,
        ...req.body.address,
      };
    }

    if (req.user.role === 'doctor') {
      user.specialization = req.body.specialization || user.specialization;
      user.qualification = req.body.qualification || user.qualification;
      user.experience = req.body.experience || user.experience;
      user.fees = req.body.fees || user.fees;
      user.about = req.body.about || user.about;
      if (req.body.hospital) {
        user.hospital = {
          ...user.hospital,
          ...req.body.hospital,
        };
      }
      if (req.body.availability) {
        user.availability = {
          ...user.availability,
          ...req.body.availability,
        };
      }
    }

    const updatedUser = await user.save();

    res.json({
      success: true,
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        age: updatedUser.age,
        gender: updatedUser.gender,
        address: updatedUser.address,
        token: generateToken(updatedUser._id, updatedUser.role),
      },
      message: 'Profile updated successfully',
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/auth/users
 * @access  Private/Admin
 */
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: 'user' });

  res.json({
    success: true,
    data: users,
  });
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  getUsers,
};