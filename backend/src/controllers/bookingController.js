const asyncHandler = require('../utils/asyncHandler');
const Booking = require('../models/Booking');
const Doctor = require('../models/Doctor');

const createBooking = asyncHandler(async (req, res) => {
  // Accept both 'doctorId' and 'doctor' field names from frontend
  const doctorId = req.body.doctorId || req.body.doctor;
  // Accept both backend (date/time) and frontend (appointmentDate/timeSlot) field names
  const date = req.body.date || req.body.appointmentDate;
  const time = req.body.time || req.body.timeSlot;
  const { notes, reason, sharedReports } = req.body;
  
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor not found');
  }

  const existingBooking = await Booking.findOne({ doctorId, date, time, status: { $ne: 'cancelled' } });
  if (existingBooking) {
    res.status(400);
    throw new Error('This slot is already booked. Please choose a different time.');
  }

  const booking = await Booking.create({
    userId: req.user.id,
    doctorId,
    date,
    time,
    notes: notes || reason,
    sharedReports: sharedReports || []
  });
  
  const populated = await Booking.findById(booking._id)
    .populate('doctorId', 'specialization fees clinicAddress')
    .populate('userId', 'name email phone')
    .populate('sharedReports');
    
  res.status(201).json({ success: true, data: populated });
});

const getMyBookings = asyncHandler(async (req, res) => {
  let query;
  if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    query = { doctorId: doctor?._id };
  } else {
    query = { userId: req.user.id };
  }

  const bookings = await Booking.find(query)
    .populate({ path: 'doctorId', select: 'specialization fees clinicAddress', populate: { path: 'userId', select: 'name email avatar' } })
    .populate('userId', 'name email phone')
    .populate('sharedReports')
    .sort({ date: -1 });
  res.json({ success: true, data: bookings });
});

const getUpcomingBookings = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let query;
  if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    query = { doctorId: doctor?._id, date: { $gte: today }, status: { $ne: 'cancelled' } };
  } else {
    query = { userId: req.user.id, date: { $gte: today }, status: { $ne: 'cancelled' } };
  }

  const bookings = await Booking.find(query)
    .populate({ path: 'doctorId', select: 'specialization fees clinicAddress', populate: { path: 'userId', select: 'name email avatar' } })
    .populate('userId', 'name email phone')
    .populate('sharedReports')
    .sort({ date: 1 })
    .limit(10);
  res.json({ success: true, data: bookings });
});

const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate({ path: 'doctorId', select: 'specialization fees clinicAddress', populate: { path: 'userId', select: 'name email avatar' } })
    .populate('userId', 'name email phone')
    .populate('sharedReports');

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  // Security check: Only patient or assigned doctor can view
  const isOwner = booking.userId._id.toString() === req.user.id;
  const isAssignedDoctor = booking.doctorId.userId?._id?.toString() === req.user.id || 
                          booking.doctorId._id.toString() === req.user.id; // handle both cases

  if (!isOwner && !isAssignedDoctor && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to view this booking');
  }

  res.json({ success: true, data: booking });
});

const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }
  booking.status = status;
  await booking.save();
  res.json({ success: true, data: booking });
});

const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }
  booking.status = 'cancelled';
  await booking.save();
  res.json({ success: true, data: booking });
});

module.exports = { 
  createBooking, 
  getMyBookings, 
  getUpcomingBookings, 
  getBookingById,
  updateBookingStatus, 
  cancelBooking 
};
