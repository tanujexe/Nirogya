const asyncHandler = require('../utils/asyncHandler');
const Lab = require('../models/Lab');
const Booking = require('../models/Booking');

// ── GET ALL LAB TESTS ─────────────────────────────────────────────────────────
const getLabs = asyncHandler(async (req, res) => {
  const { category, search, popular, fasting, homeCollection } = req.query;
  const query = {};

  if (category && category !== 'all') {
    query.category = category;
  }
  if (popular === 'true')        query.popular        = true;
  if (fasting === 'true')        query.fasting        = true;
  if (homeCollection === 'true') query.homeCollection = true;

  let tests = await Lab.find(query).sort({ popular: -1, testName: 1 }).lean();

  // Client-side search filter (small dataset)
  if (search) {
    const q = search.toLowerCase();
    tests = tests.filter(t =>
      t.testName?.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, data: tests, total: tests.length });
});

// ── GET SINGLE LAB TEST ───────────────────────────────────────────────────────
const getLabById = asyncHandler(async (req, res) => {
  const test = await Lab.findById(req.params.id);
  if (!test) {
    res.status(404);
    throw new Error('Lab test not found');
  }
  res.json({ success: true, data: test });
});

// ── BOOK LAB TEST ─────────────────────────────────────────────────────────────
const bookTest = asyncHandler(async (req, res) => {
  const { testId, date, timeSlot, homeCollection, address, notes } = req.body;

  if (!testId || !date) {
    res.status(400);
    throw new Error('testId and date are required');
  }

  const test = await Lab.findById(testId);
  if (!test) {
    res.status(404);
    throw new Error('Lab test not found');
  }

  // Prevent double booking for same test at same slot
  if (timeSlot) {
    const existing = await Booking.findOne({
      userId:     req.user.id,
      providerId: testId,
      type:       'lab',
      date:       new Date(date),
      timeSlot,
      status:     { $nin: ['cancelled'] }
    });
    if (existing) {
      res.status(400);
      throw new Error('You already have a booking for this test at this time');
    }
  }

  const booking = await Booking.create({
    userId:     req.user.id,
    providerId: testId,
    type:       'lab',
    date:       new Date(date),
    timeSlot:   timeSlot || null,
    status:     'confirmed',
    notes,
    details: {
      testName:       test.testName,
      category:       test.category,
      price:          test.price,
      homeCollection: homeCollection ?? test.homeCollection,
      address:        homeCollection ? address : null,
    },
    paymentStatus: 'pending',
  });

  res.status(201).json({
    success: true,
    message: `${test.testName} booked successfully`,
    data: booking
  });
});

// ── UPDATE LAB BOOKING STATUS (lab staff / admin) ─────────────────────────────
// Statuses: booked → sample_collected → processing → report_ready
const updateLabBookingStatus = asyncHandler(async (req, res) => {
  const { status, reportUrl } = req.body;
  const validStatuses = ['confirmed', 'in-progress', 'completed', 'cancelled'];

  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const booking = await Booking.findById(req.params.id);
  if (!booking || booking.type !== 'lab') {
    res.status(404);
    throw new Error('Lab booking not found');
  }

  booking.status = status;
  if (reportUrl) {
    booking.details = { ...booking.details, reportUrl };
  }
  await booking.save();

  res.json({ success: true, data: booking });
});

module.exports = { getLabs, getLabById, bookTest, updateLabBookingStatus };
