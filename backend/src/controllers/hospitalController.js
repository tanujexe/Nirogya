const asyncHandler = require('../utils/asyncHandler');
const Hospital = require('../models/Hospital');

const getHospitals = asyncHandler(async (req, res) => {
  const hospitals = await Hospital.find({});
  res.json({ success: true, data: hospitals });
});

const getNearbyHospitals = asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;
  // Simple fetching all for now, in prod you'd use geo queries
  const hospitals = await Hospital.find({});
  res.json({ success: true, data: hospitals });
});

module.exports = { getHospitals, getNearbyHospitals };
