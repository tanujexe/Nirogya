const asyncHandler = require('../utils/asyncHandler');
const Lab = require('../models/Lab');

const getLabs = asyncHandler(async (req, res) => {
  const labs = await Lab.find({});
  res.json({ success: true, data: labs });
});

const bookTest = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, message: 'Test booked successfully', data: req.body });
});

module.exports = { getLabs, bookTest };
