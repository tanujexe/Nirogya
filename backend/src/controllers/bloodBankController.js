const asyncHandler = require('../utils/asyncHandler');
const BloodBank = require('../models/BloodBank');

const getBloodBanks = asyncHandler(async (req, res) => {
  const banks = await BloodBank.find({});
  res.json({ success: true, data: banks });
});

const searchBloodGroup = asyncHandler(async (req, res) => {
  const { group } = req.query;
  const banks = await BloodBank.find({});
  // In real app, filter by group stock > 0
  res.json({ success: true, data: banks });
});

module.exports = { getBloodBanks, searchBloodGroup };
