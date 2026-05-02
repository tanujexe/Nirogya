const asyncHandler = require('../utils/asyncHandler');
const Ambulance = require('../models/Ambulance');

const getAmbulances = asyncHandler(async (req, res) => {
  const ambulances = await Ambulance.find({ available: true });
  res.json({ success: true, data: ambulances });
});

const requestAmbulance = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, message: 'Ambulance requested', data: req.body });
});

module.exports = { getAmbulances, requestAmbulance };
