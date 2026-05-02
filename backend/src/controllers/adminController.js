const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Booking = require('../models/Booking');
const Hospital = require('../models/Hospital');
const BloodBankProvider = require('../models/BloodBankProvider');
const AmbulanceProvider = require('../models/AmbulanceProvider');
const LabProvider = require('../models/LabProvider');

// ── ANALYTICS ────────────────────────────────────────────────────────────────
const getAnalytics = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  try {
    const [
      totalUsers, totalDoctors, pendingDoctors, suspendedDoctors,
      totalBookings, todayBookings,
      totalHospitals, totalLabs, totalBloodBanks,
      totalAmbulances,
      recentUsers
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }).catch(e => { console.error('User count error:', e); return 0; }),
      Doctor.countDocuments().catch(e => { console.error('Doctor count error:', e); return 0; }),
      Doctor.countDocuments({ verified: false, status: { $ne: 'suspended' } }).catch(() => 0),
      Doctor.countDocuments({ status: 'suspended' }).catch(() => 0),
      Booking.countDocuments().catch(e => { console.error('Booking count error:', e); return 0; }),
      Booking.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }).catch(() => 0),
      Hospital.countDocuments().catch(() => 0),
      LabProvider.countDocuments().catch(() => 0),
      BloodBankProvider.countDocuments().catch(() => 0),
      AmbulanceProvider.countDocuments().catch(() => 0),
      User.find({ role: 'user' }).sort({ createdAt: -1 }).limit(5).select('name email createdAt avatar').lean().catch(() => []),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        totalDoctors: totalDoctors || 0,
        pendingDoctors: pendingDoctors || 0,
        suspendedDoctors: suspendedDoctors || 0,
        totalBookings: totalBookings || 0,
        todayBookings: todayBookings || 0,
        totalHospitals: totalHospitals || 0,
        totalLabs: totalLabs || 0,
        totalBloodBanks: totalBloodBanks || 0,
        totalAmbulances: totalAmbulances || 0,
        recentUsers: recentUsers || [],
      }
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching analytics' });
  }
});

// ── DOCTORS ──────────────────────────────────────────────────────────────────
const getAllDoctors = asyncHandler(async (req, res) => {
  const { search, specialization, status, sort } = req.query;

  const matchQuery = {};
  if (specialization && specialization !== 'all') matchQuery.specialization = { $regex: specialization, $options: 'i' };
  if (status === 'verified') matchQuery.verified = true;
  if (status === 'pending') matchQuery.verified = false;
  if (status === 'suspended') matchQuery.status = 'suspended';
  if (status === 'active') { matchQuery.verified = true; matchQuery.status = { $ne: 'suspended' }; }

  let sortObj = { createdAt: -1 };
  if (sort === 'rating') sortObj = { rating: -1 };
  if (sort === 'bookings') sortObj = { bookingsCount: -1 };
  if (sort === 'low_rated') sortObj = { rating: 1 };

  let doctors = await Doctor.find(matchQuery)
    .populate('userId', 'name email phone avatar isVerified createdAt')
    .sort(sortObj)
    .lean();

  // Apply name/email search after populate
  if (search) {
    const q = search.toLowerCase();
    doctors = doctors.filter(d =>
      d.userId?.name?.toLowerCase().includes(q) ||
      d.userId?.email?.toLowerCase().includes(q) ||
      d.specialization?.toLowerCase().includes(q) ||
      d.licenseNumber?.toLowerCase().includes(q)
    );
  }

  // Enrich with bookings count
  const doctorIds = doctors.map(d => d._id);
  const bookingCounts = await Booking.aggregate([
    { $match: { doctorId: { $in: doctorIds } } },
    { $group: { _id: '$doctorId', count: { $sum: 1 } } }
  ]);
  const bookingMap = Object.fromEntries(bookingCounts.map(b => [b._id.toString(), b.count]));

  doctors = doctors.map(d => ({
    ...d,
    bookingsCount: bookingMap[d._id.toString()] || 0,
  }));

  res.json({ success: true, data: doctors, total: doctors.length });
});

const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id)
    .populate('userId', 'name email phone avatar isVerified createdAt');
  if (!doctor) { res.status(404); throw new Error('Doctor not found'); }

  const bookingsCount = await Booking.countDocuments({ doctorId: doctor._id });
  const patientsServed = await Booking.distinct('userId', { doctorId: doctor._id, status: 'completed' });

  res.json({
    success: true,
    data: { ...doctor.toObject(), bookingsCount, patientsServed: patientsServed.length }
  });
});

const verifyDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) { res.status(404); throw new Error('Doctor not found'); }

  doctor.verified = true;
  doctor.status = 'active';
  await doctor.save();
  await User.findByIdAndUpdate(doctor.userId, { isVerified: true });

  res.json({ success: true, message: 'Doctor verified successfully', data: doctor });
});

const rejectDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) { res.status(404); throw new Error('Doctor not found'); }

  doctor.verified = false;
  doctor.status = 'rejected';
  doctor.rejectionReason = req.body.reason || 'Documents do not meet requirements';
  await doctor.save();

  res.json({ success: true, message: 'Doctor application rejected' });
});

const suspendDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) { res.status(404); throw new Error('Doctor not found'); }

  doctor.status = 'suspended';
  doctor.suspendedReason = req.body.reason || 'Policy violation';
  await doctor.save();
  await User.findByIdAndUpdate(doctor.userId, { isVerified: false });

  res.json({ success: true, message: 'Doctor account suspended' });
});

const activateDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) { res.status(404); throw new Error('Doctor not found'); }

  doctor.status = 'active';
  doctor.verified = true;
  delete doctor.suspendedReason;
  await doctor.save();
  await User.findByIdAndUpdate(doctor.userId, { isVerified: true });

  res.json({ success: true, message: 'Doctor account activated' });
});

const updateDoctorByAdmin = asyncHandler(async (req, res) => {
  const { fees, availableSlots, specialization, qualification } = req.body;
  const updateFields = {};
  if (fees !== undefined) updateFields.fees = fees;
  if (availableSlots) updateFields.availableSlots = availableSlots;
  if (specialization) updateFields.specialization = specialization;
  if (qualification) updateFields.qualification = qualification;

  const doctor = await Doctor.findByIdAndUpdate(
    req.params.id,
    updateFields,
    { new: true }
  ).populate('userId', 'name email phone avatar');

  if (!doctor) { res.status(404); throw new Error('Doctor not found'); }
  res.json({ success: true, data: doctor });
});

// ── USERS ────────────────────────────────────────────────────────────────────
const getAllUsers = asyncHandler(async (req, res) => {
  const { search, role } = req.query;
  const query = {};
  if (role && role !== 'all') query.role = role;
  else query.role = 'user'; // default: patients only

  let users = await User.find(query).select('-password').sort({ createdAt: -1 }).lean();

  if (search) {
    const q = search.toLowerCase();
    users = users.filter(u =>
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.includes(q)
    );
  }

  // Enrich with booking counts
  const userIds = users.map(u => u._id);
  const bookingCounts = await Booking.aggregate([
    { $match: { userId: { $in: userIds } } },
    { $group: { _id: '$userId', count: { $sum: 1 } } }
  ]);
  const bookingMap = Object.fromEntries(bookingCounts.map(b => [b._id.toString(), b.count]));
  users = users.map(u => ({ ...u, bookingsCount: bookingMap[u._id.toString()] || 0 }));

  res.json({ success: true, data: users, total: users.length });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  if (user.role === 'doctor') await Doctor.findOneAndDelete({ userId: user._id });
  await user.deleteOne();
  res.json({ success: true, message: 'User removed' });
});

// ── PENDING DOCTORS ──────────────────────────────────────────────────────────
const getPendingDoctors = asyncHandler(async (req, res) => {
  const doctors = await Doctor.find({ verified: false, status: { $ne: 'rejected' } })
    .populate('userId', 'name email phone avatar createdAt')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, data: doctors });
});

// ── GENERAL PROVIDERS ────────────────────────────────────────────────────────
const getAllProviders = asyncHandler(async (req, res) => {
  const { type, status } = req.query;
  let Model;
  
  try {
    switch (type) {
      case 'doctor': Model = Doctor; break;
      case 'ambulance': Model = AmbulanceProvider; break;
      case 'bloodbank': Model = BloodBankProvider; break;
      case 'lab': Model = LabProvider; break;
      default: Model = Doctor;
    }

    const matchQuery = {};
    if (status && status !== 'all') {
      matchQuery.status = status;
    }

    const providers = await Model.find(matchQuery)
      .populate('userId', 'name email phone avatar isVerified createdAt')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: providers || [] });
  } catch (error) {
    console.error(`Error fetching providers (${type}):`, error);
    res.status(500).json({ success: false, message: 'Failed to fetch providers' });
  }
});

const approveProvider = asyncHandler(async (req, res) => {
  const { id, type } = req.params;
  let Model;
  switch (type) {
    case 'doctor': Model = Doctor; break;
    case 'ambulance': Model = AmbulanceProvider; break;
    case 'bloodbank': Model = BloodBankProvider; break;
    case 'lab': Model = LabProvider; break;
    default: res.status(400); throw new Error('Invalid type');
  }

  const provider = await Model.findById(id);
  if (!provider) { res.status(404); throw new Error('Provider not found'); }

  provider.verified = true;
  provider.status = 'active';
  await provider.save();

  // Update user role and status
  await User.findByIdAndUpdate(provider.userId, { 
    role: type, 
    isVerified: true,
    status: 'active'
  });

  res.json({ success: true, message: `${type} approved successfully` });
});
const getAllBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find()
    .populate('userId', 'name email')
    .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
    .sort({ createdAt: -1 })
    .limit(100);
  res.json({ success: true, data: bookings });
});

module.exports = {
  getAnalytics,
  getAllDoctors,
  getDoctorById,
  verifyDoctor,
  rejectDoctor,
  suspendDoctor,
  activateDoctor,
  updateDoctorByAdmin,
  getAllUsers,
  deleteUser,
  getPendingDoctors,
  getAllBookings,
  getAllProviders,
  approveProvider,
};
