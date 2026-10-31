const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json({ success: true, data: user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (user) {
    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    user.address = req.body.address || user.address;
    user.avatar = req.body.avatar || user.avatar;
    if (req.body.password) {
      user.password = req.body.password;
    }
    const updatedUser = await user.save();

    // If the user is an ambulance pilot, sync their cached info in the Ambulance collection
    if (updatedUser.role === 'ambulance') {
      const Ambulance = require('../models/Ambulance');
      await Ambulance.findOneAndUpdate(
        { driverId: updatedUser._id },
        { 
          driverName: updatedUser.name,
          phone: updatedUser.phone
        }
      );
    }
    res.json({
      success: true,
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      }
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

module.exports = { getProfile, updateProfile };
