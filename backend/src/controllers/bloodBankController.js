const asyncHandler = require('../utils/asyncHandler');
const BloodBank = require('../models/BloodBank');
const Booking = require('../models/Booking');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

// ── GET ALL BLOOD BANKS ────────────────────────────────────────────────────────
const getBloodBanks = asyncHandler(async (req, res) => {
  const { group, city } = req.query;
  const query = {};

  if (city) query.city = { $regex: city, $options: 'i' };

  // Filter by blood group availability
  if (group && BLOOD_GROUPS.includes(group)) {
    query[`stock.${group}`] = { $gt: 0 };
  }

  const banks = await BloodBank.find(query).sort({ name: 1 });
  res.json({ success: true, data: banks, total: banks.length });
});

// ── SEARCH BY BLOOD GROUP ─────────────────────────────────────────────────────
const searchBloodGroup = asyncHandler(async (req, res) => {
  const { group } = req.query;

  if (!group || !BLOOD_GROUPS.includes(group)) {
    res.status(400);
    throw new Error(`Invalid blood group. Must be one of: ${BLOOD_GROUPS.join(', ')}`);
  }

  const banks = await BloodBank.find({ [`stock.${group}`]: { $gt: 0 } }).sort({ name: 1 });
  res.json({ success: true, data: banks, total: banks.length });
});

// ── REQUEST BLOOD ──────────────────────────────────────────────────────────────
// Authenticated — reduces stock atomically to prevent race conditions
const requestBlood = asyncHandler(async (req, res) => {
  const { bankId, bloodGroup, units = 1, date, notes } = req.body;

  if (!bankId || !bloodGroup || !date) {
    res.status(400);
    throw new Error('bankId, bloodGroup, and date are required');
  }
  if (!BLOOD_GROUPS.includes(bloodGroup)) {
    res.status(400);
    throw new Error('Invalid blood group');
  }

  const unitsNum = Number(units);
  if (isNaN(unitsNum) || unitsNum < 1 || unitsNum > 10) {
    res.status(400);
    throw new Error('Units must be between 1 and 10');
  }

  // Atomic stock decrement — prevents overbooking even under concurrent requests
  const bank = await BloodBank.findOneAndUpdate(
    { _id: bankId, [`stock.${bloodGroup}`]: { $gte: unitsNum } },
    { $inc: { [`stock.${bloodGroup}`]: -unitsNum } },
    { new: true }
  );

  if (!bank) {
    res.status(400);
    throw new Error(`Insufficient ${bloodGroup} blood stock at this bank`);
  }

  // Create a unified booking record
  const booking = await Booking.create({
    userId:     req.user.id,
    providerId: bank.providerId || bankId,
    type:       'blood',
    date:       new Date(date),
    status:     'confirmed',
    notes,
    details:    { bloodGroup, units: unitsNum, bankName: bank.name },
    paymentStatus: 'pending',
  });

  res.status(201).json({
    success: true,
    message: `${unitsNum} unit(s) of ${bloodGroup} blood successfully reserved`,
    data: { booking, updatedStock: bank.stock }
  });
});

// ── GET BLOOD BANK BY ID ───────────────────────────────────────────────────────
const getBloodBankById = asyncHandler(async (req, res) => {
  const bank = await BloodBank.findById(req.params.id);
  if (!bank) {
    res.status(404);
    throw new Error('Blood bank not found');
  }
  res.json({ success: true, data: bank });
});

module.exports = { getBloodBanks, searchBloodGroup, requestBlood, getBloodBankById };
