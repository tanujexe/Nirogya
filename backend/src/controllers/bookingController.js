const asyncHandler = require('../utils/asyncHandler');
const Booking = require('../models/Booking');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Notification = require('../models/Notification');

// ── Helpers ──────────────────────────────────────────────────────────────────
const createNotification = async (userId, title, message, type = 'booking', link = null) => {
  try {
    await Notification.create({ userId, title, message, type, link });
  } catch (e) {
    console.error('Notification create error:', e.message);
  }
};

// ── CREATE BOOKING ────────────────────────────────────────────────────────────
const createBooking = asyncHandler(async (req, res) => {
  const {
    providerId, doctorId, type = 'doctor',
    date, timeSlot, time,
    notes, reason, details, metadata, sharedReports,
    appointmentDate
  } = req.body;

  const resolvedProviderId = providerId || doctorId;
  const resolvedDate = date || appointmentDate;
  const resolvedSlot = timeSlot || time;

  if (!resolvedProviderId) {
    res.status(400);
    throw new Error('providerId is required');
  }
  if (!resolvedDate) {
    res.status(400);
    throw new Error('date is required');
  }

  // Prevent double booking (slot-level lock)
  if (resolvedSlot) {
    const existing = await Booking.findOne({
      providerId: resolvedProviderId,
      date: new Date(resolvedDate),
      timeSlot: resolvedSlot,
      status: { $nin: ['cancelled'] }
    });
    if (existing) {
      res.status(400);
      throw new Error('This time slot is already booked. Please choose a different time.');
    }
  }

  let providerModel = 'Doctor';
  if (type === 'ambulance') providerModel = 'AmbulanceProvider';
  else if (type === 'blood') providerModel = 'BloodBankProvider';
  else if (type === 'lab') providerModel = 'LabProvider';
  else if (type === 'hospital') providerModel = 'Hospital';

  // Merge extra fields cleanly so nothing is lost
  const resolvedDetails = {
    ...(metadata || {}),
    ...(details || {}),
  };
  if (req.body.patientName && !resolvedDetails.patientName) resolvedDetails.patientName = req.body.patientName;
  if (req.body.phone && !resolvedDetails.phone) resolvedDetails.phone = req.body.phone;
  if (req.body.email && !resolvedDetails.email) resolvedDetails.email = req.body.email;
  if (req.body.address && !resolvedDetails.address) resolvedDetails.address = req.body.address;

  const booking = await Booking.create({
    userId:        req.user.id,
    providerId:    resolvedProviderId,
    providerModel,
    type,
    date:          new Date(resolvedDate),
    timeSlot:      resolvedSlot,
    notes:         notes || reason,
    details:       resolvedDetails,
    sharedReports: sharedReports || [],
  });

  // If user profile has no phone and one was provided during booking, update user profile
  if (resolvedDetails.phone) {
    try {
      const userDoc = await User.findById(req.user.id);
      if (userDoc && !userDoc.phone) {
        userDoc.phone = resolvedDetails.phone;
        await userDoc.save();
      }
    } catch (e) {
      console.warn('Could not update user phone:', e.message);
    }
  }

  // Notify provider (doctor only for now)
  if (type === 'doctor') {
    const doctor = await Doctor.findById(resolvedProviderId).populate('userId', '_id name');
    if (doctor?.userId?._id) {
      await createNotification(
        doctor.userId._id,
        'New Appointment Request',
        `You have a new appointment on ${new Date(resolvedDate).toDateString()}${resolvedSlot ? ' at ' + resolvedSlot : ''}.`,
        'booking',
        `/dashboard`
      );
    }
  }

  const populated = await Booking.findById(booking._id)
    .populate({ path: 'providerId' })
    .populate('userId', 'name email phone avatar age gender address')
    .populate('sharedReports');

  res.status(201).json({ success: true, data: populated });
});

// ── GET MY BOOKINGS ────────────────────────────────────────────────────────────
const getMyBookings = asyncHandler(async (req, res) => {
  const { status, type, page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  let matchQuery = {};

  // Role-based logic for providers vs patients
  if (req.user.role === 'admin') {
    // Admin sees everything if they want
    matchQuery = {};
  } else if (['doctor', 'ambulance', 'bloodbank', 'lab'].includes(req.user.role)) {
    // Provider views their incoming requests
    let providerId;
    if (req.user.role === 'doctor') {
      const doc = await Doctor.findOne({ userId: req.user.id });
      providerId = doc?._id;
    } else if (req.user.role === 'ambulance') {
      const ambProvider = await require('../models/AmbulanceProvider').findOne({ userId: req.user.id });
      providerId = ambProvider?._id;
      if (!providerId) {
        const ambDriver = await require('../models/Ambulance').findOne({ driverId: req.user.id });
        providerId = ambDriver?.providerId;
      }

      let ambulanceIds = [];
      if (providerId) {
        const ambulances = await require('../models/Ambulance').find({ providerId }).select('_id');
        ambulanceIds = ambulances.map(a => a._id);
      }

      matchQuery = {
        type: 'ambulance',
        $or: [
          ...(providerId ? [{ providerId }] : []),
          ...(ambulanceIds.length > 0 ? [{ ambulance: { $in: ambulanceIds } }] : []),
          { status: 'pending' },
          { providerId: null },
          { providerId: { $exists: false } }
        ]
      };
    } else if (req.user.role === 'bloodbank') {
      const bank = await require('../models/BloodBankProvider').findOne({ userId: req.user.id });
      providerId = bank?._id;
    } else if (req.user.role === 'lab') {
      const lab = await require('../models/LabProvider').findOne({ userId: req.user.id });
      providerId = lab?._id;
    }

    if (!matchQuery.$or && !providerId) return res.json({ success: true, data: [], total: 0 });
    if (!matchQuery.$or && providerId) matchQuery = { providerId };
  } else {
    // Regular user views their own bookings
    matchQuery = { userId: req.user.id };
  }

  if (status && status !== 'all') {
    if (matchQuery.$or) {
      matchQuery = {
        $and: [
          matchQuery,
          { status }
        ]
      };
    } else {
      matchQuery.status = status;
    }
  }
  if (type && type !== 'all') {
    matchQuery.type = type;
  }

  const total = await Booking.countDocuments(matchQuery);
  const bookings = await Booking.find(matchQuery)
    .populate({
      path: 'providerId',
      populate: { path: 'userId', select: 'name email avatar phone address' }
    })
    .populate('userId', 'name email phone avatar age gender address')
    .populate('sharedReports')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

  res.json({ success: true, data: bookings, total, page: Number(page) });
});

// ── GET UPCOMING BOOKINGS ─────────────────────────────────────────────────────
const getUpcomingBookings = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let matchQuery = { date: { $gte: today }, status: { $nin: ['cancelled', 'completed'] } };

  if (['doctor', 'ambulance', 'bloodbank', 'lab'].includes(req.user.role)) {
    let providerId;
    if (req.user.role === 'doctor') {
      const doc = await Doctor.findOne({ userId: req.user.id });
      providerId = doc?._id;
    } else if (req.user.role === 'ambulance') {
      const ambProvider = await require('../models/AmbulanceProvider').findOne({ userId: req.user.id });
      const ambDriver = await require('../models/Ambulance').findOne({ driverId: req.user.id });
      providerId = ambProvider?._id || ambDriver?.providerId;
      matchQuery.type = 'ambulance';
      matchQuery.$or = [
        ...(providerId ? [{ providerId }] : []),
        { status: 'pending' },
        { providerId: null },
        { providerId: { $exists: false } }
      ];
    } else if (req.user.role === 'bloodbank') {
      const bank = await require('../models/BloodBankProvider').findOne({ userId: req.user.id });
      providerId = bank?._id;
    } else if (req.user.role === 'lab') {
      const lab = await require('../models/LabProvider').findOne({ userId: req.user.id });
      providerId = lab?._id;
    }
    if (!providerId) return res.json({ success: true, data: [] });
    matchQuery.providerId = providerId;
  } else {
    matchQuery.userId = req.user.id;
  }

  const bookings = await Booking.find(matchQuery)
    .populate({
      path: 'providerId',
      populate: { path: 'userId', select: 'name email avatar phone address' }
    })
    .populate('userId', 'name email phone avatar age gender address')
    .sort({ date: 1 })
    .limit(10)
    .lean();

  res.json({ success: true, data: bookings });
});

// ── GET BOOKING BY ID ────────────────────────────────────────────────────────
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate({ path: 'providerId', populate: { path: 'userId', select: 'name email avatar phone address' } })
    .populate('userId', 'name email phone avatar age gender address')
    .populate('sharedReports')
    .lean();

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  // Auth: Patient, Admin, or the specific Provider can view
  const isOwner = booking.userId._id.toString() === req.user.id;
  const isProvider = booking.providerId?.userId?._id.toString() === req.user.id;
  
  if (!isOwner && !isProvider && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to view this booking');
  }

  res.json({ success: true, data: booking });
});

// ── UPDATE BOOKING STATUS ─────────────────────────────────────────────────────
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status, details } = req.body;
  const allowed = ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'];

  if (!allowed.includes(status)) {
    res.status(400);
    throw new Error(`Invalid status: ${status}`);
  }

  const booking = await Booking.findById(req.params.id).populate('providerId');
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  // Security: Only the provider or admin can update status
  const isProvider = booking.providerId?.userId?.toString() === req.user.id;
  if (!isProvider && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only the assigned provider can update status');
  }

  booking.status = status;
  if (details) booking.details = { ...booking.details, ...details };
  await booking.save();

  // Notify patient
  await createNotification(
    booking.userId,
    'Booking Status Updated',
    `Your booking with ${booking.providerId?.businessName || 'Provider'} is now ${status}.`,
    'booking',
    `/dashboard`
  );

  res.json({ success: true, data: booking });
});

// ── CANCEL BOOKING ────────────────────────────────────────────────────────────
const cancelBooking = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  // Security: Patient, Provider, or Admin can cancel
  const isOwner = booking.userId.toString() === req.user.id;
  const isProvider = booking.providerId?.userId?.toString() === req.user.id;
  
  if (!isOwner && !isProvider && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to cancel this booking');
  }

  if (booking.status === 'completed') {
    res.status(400);
    throw new Error('Cannot cancel a completed booking');
  }

  booking.status = 'cancelled';
  booking.cancelReason = reason || 'Cancelled';
  await booking.save();

  // Notify the other party
  const recipient = isOwner ? booking.providerId?.userId : booking.userId;
  if (recipient) {
    await createNotification(
      recipient,
      'Booking Cancelled',
      `Booking on ${new Date(booking.date).toDateString()} has been cancelled.`,
      'booking',
      `/dashboard`
    );
  }

  res.json({ success: true, data: booking, message: 'Booking cancelled' });
});

module.exports = {
  createBooking,
  getMyBookings,
  getUpcomingBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
};
