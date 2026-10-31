const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Booking = require('../models/Booking');
const Hospital = require('../models/Hospital');
const BloodBankProvider = require('../models/BloodBankProvider');
const AmbulanceProvider = require('../models/AmbulanceProvider');
const LabProvider = require('../models/LabProvider');
const Ambulance = require('../models/Ambulance');
const BloodBank = require('../models/BloodBank');
const Lab = require('../models/Lab');

// ── ANALYTICS ────────────────────────────────────────────────────────────────
const getAnalytics = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const [
    totalUsers, totalDoctors, pendingDoctors, suspendedDoctors,
    totalBookings, todayBookings,
    totalHospitals, totalLabs, totalBloodBanks,
    totalAmbulances,
    recentUsers
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Doctor.countDocuments(),
    Doctor.countDocuments({ verified: false, status: { $ne: 'suspended' } }),
    Doctor.countDocuments({ status: 'suspended' }),
    Booking.countDocuments(),
    Booking.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
    Hospital.countDocuments(),
    LabProvider.countDocuments(),
    BloodBankProvider.countDocuments(),
    AmbulanceProvider.countDocuments(),
    User.find({ role: 'user' }).sort({ createdAt: -1 }).limit(5).select('name email createdAt avatar').lean(),
  ]);

  res.json({
    success: true,
    data: {
      totalUsers,
      totalDoctors,
      pendingDoctors,
      suspendedDoctors,
      totalBookings,
      todayBookings,
      totalHospitals,
      totalLabs,
      totalBloodBanks,
      totalAmbulances,
      recentUsers,
    }
  });
});

// ── DOCTORS ──────────────────────────────────────────────────────────────────
const getAllDoctors = asyncHandler(async (req, res) => {
  const { search, specialization, status, sort, page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

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

  let doctorQuery = Doctor.find(matchQuery);

  // Search by name/email requires joining with User collection
  // For better scalability, we use aggregation or search by ID after finding users
  if (search) {
    const users = await User.find({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }).select('_id');
    const userIds = users.map(u => u._id);
    matchQuery.$or = [
      { userId: { $in: userIds } },
      { specialization: { $regex: search, $options: 'i' } },
      { licenseNumber: { $regex: search, $options: 'i' } }
    ];
  }

  const total = await Doctor.countDocuments(matchQuery);
  let doctors = await Doctor.find(matchQuery)
    .populate('userId', 'name email phone avatar isVerified createdAt')
    .sort(sortObj)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  // Enrich with bookings count
  const doctorIds = doctors.map(d => d._id);
  const bookingCounts = await Booking.aggregate([
    { $match: { providerId: { $in: doctorIds } } },
    { $group: { _id: '$providerId', count: { $sum: 1 } } }
  ]);
  const bookingMap = Object.fromEntries(bookingCounts.map(b => [b._id.toString(), b.count]));

  doctors = doctors.map(d => ({
    ...d,
    bookingsCount: bookingMap[d._id.toString()] || 0,
  }));

  res.json({ success: true, data: doctors, total, page: parseInt(page), limit: parseInt(limit) });
});

const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id)
    .populate('userId', 'name email phone avatar isVerified createdAt');
  if (!doctor) { res.status(404); throw new Error('Doctor not found'); }

  const bookingsCount = await Booking.countDocuments({ providerId: doctor._id });
  const patientsServed = await Booking.distinct('userId', { providerId: doctor._id, status: 'completed' });

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
  doctor.hasVerifiedBadge = true; // Auto-award badge on admin approval
  await doctor.save();

  // Sync User document: Role must be doctor, verified must be true, status must be active
  await User.findByIdAndUpdate(doctor.userId, { 
    role: 'doctor',
    isVerified: true,
    status: 'active'
  });

  res.json({ success: true, message: 'Doctor verified and promoted successfully', data: doctor });
});

const rejectDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) { res.status(404); throw new Error('Doctor not found'); }

  doctor.verified = false;
  doctor.status = 'rejected';
  doctor.rejectionReason = req.body.reason || 'Documents do not meet requirements';
  await doctor.save();

  // Reset user status so they can apply again
  await User.findByIdAndUpdate(doctor.userId, { status: 'active' });

  res.json({ success: true, message: 'Doctor application rejected' });
});

const suspendDoctor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const doctor = await Doctor.findById(id);
  if (!doctor) { res.status(404); throw new Error('Doctor not found'); }

  doctor.status = 'suspended';
  doctor.suspendedReason = req.body.reason || 'Policy violation';
  await doctor.save();

  // Suspend the user as well
  await User.findByIdAndUpdate(doctor.userId, { 
    isVerified: false, 
    status: 'suspended' 
  });

  res.json({ success: true, message: 'Doctor account suspended' });
});

const suspendProvider = asyncHandler(async (req, res) => {
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

  const reason = req.body?.reason || 'Policy violation';
  
  provider.status = 'suspended';
  provider.suspendedReason = reason;
  await provider.save();

  // Suspend the user to block login/access and record details
  await User.findByIdAndUpdate(provider.userId, { 
    isVerified: false, 
    status: 'suspended',
    suspensionDetails: {
      isSuspended: true,
      type: 'suspension',
      reason: reason,
      date: new Date(),
      previousRole: type
    }
  });

  res.json({ success: true, message: `${type} account suspended` });
});

const activateProvider = asyncHandler(async (req, res) => {
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

  provider.status = 'active';
  provider.verified = true;
  delete provider.suspendedReason;
  await provider.save();

  // Reactivate user and clear suspension info
  await User.findByIdAndUpdate(provider.userId, { 
    isVerified: true, 
    status: 'active',
    $set: { 
      'suspensionDetails.isSuspended': false,
      'suspensionDetails.type': 'none'
    }
  });

  res.json({ success: true, message: `${type} account activated` });
});

const removeProviderRole = asyncHandler(async (req, res) => {
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

  const userId = provider.userId;
  const reason = req.body?.reason || 'Manual removal by admin';

  // 1. Delete the provider profile
  await Model.findByIdAndDelete(id);

  // 2. Downgrade user role to 'user', reset status, and record removal info
  await User.findByIdAndUpdate(userId, { 
    role: 'user', 
    isVerified: false, 
    status: 'active',
    suspensionDetails: {
      isSuspended: true,
      type: 'removal',
      reason: reason,
      date: new Date(),
      previousRole: type
    }
  });

  res.json({ 
    success: true, 
    message: `Provider role removed. Account downgraded to regular user.` 
  });
});


const activateDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) { res.status(404); throw new Error('Doctor not found'); }

  doctor.status = 'active';
  doctor.verified = true;
  delete doctor.suspendedReason;
  await doctor.save();

  // Sync User document
  await User.findByIdAndUpdate(doctor.userId, { 
    role: 'doctor',
    isVerified: true, 
    status: 'active' 
  });

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
    { returnDocument: 'after' }
  ).populate('userId', 'name email phone avatar');

  if (!doctor) { res.status(404); throw new Error('Doctor not found'); }
  res.json({ success: true, data: doctor });
});

// ── USERS ────────────────────────────────────────────────────────────────────
const getAllUsers = asyncHandler(async (req, res) => {
  const { search, role, page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const query = {};
  if (role && role !== 'all') {
    query.role = role;
  } else {
    query.role = 'user'; // default: patients only
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  const total = await User.countDocuments(query);
  let users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  // Enrich with booking counts
  const userIds = users.map(u => u._id);
  const bookingCounts = await Booking.aggregate([
    { $match: { userId: { $in: userIds } } },
    { $group: { _id: '$userId', count: { $sum: 1 } } }
  ]);
  const bookingMap = Object.fromEntries(bookingCounts.map(b => [b._id.toString(), b.count]));
  users = users.map(u => ({ ...u, bookingsCount: bookingMap[u._id.toString()] || 0 }));

  res.json({ success: true, data: users, total, page: parseInt(page), limit: parseInt(limit) });
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
  const { type, status, page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;
  let Model;
  
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

  const total = await Model.countDocuments(matchQuery);
  const providers = await Model.find(matchQuery)
    .populate('userId', 'name email phone avatar isVerified createdAt')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  res.json({ success: true, data: providers || [], total, page: parseInt(page), limit: parseInt(limit) });
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
  
  // Set badges for specific types
  if (type === 'doctor') {
    provider.hasVerifiedBadge = true;
  }
  
  await provider.save();

  // Update user role and status
  await User.findByIdAndUpdate(provider.userId, { 
    role: type, 
    isVerified: true,
    status: 'active'
  });

  // ─── Post-Approval Hook: Create Child Documents ───
  // This ensures they appear in specific listings (like Ambulance Hub or Blood Search)
  try {
    if (type === 'ambulance') {
      const existing = await Ambulance.findOne({ providerId: id });
      if (!existing) {
        await Ambulance.create({
          providerId: id,
          driverId: provider.userId,
          vehicleNumber: 'PENDING',
          vehicleType: 'Basic',
          isOnline: true,
          available: true,
          liveLocation: { type: 'Point', coordinates: [78.1734, 26.2298] } // Default Gwalior
        });
      }
    } else if (type === 'bloodbank') {
      const existing = await BloodBank.findOne({ providerId: id });
      if (!existing) {
        await BloodBank.create({
          name: provider.businessName || 'New Blood Bank',
          address: provider.address,
          contact: provider.phone,
          providerId: id,
          stock: { 'A+': 0, 'O+': 0, 'B+': 0, 'AB+': 0, 'A-': 0, 'O-': 0, 'B-': 0, 'AB-': 0 },
          location: { type: 'Point', coordinates: [78.1734, 26.2298] }
        });
      }
    } else if (type === 'lab') {
      const existing = await Lab.findOne({ providerId: id });
      if (!existing) {
        await Lab.create({
          testName: 'General Consultation',
          category: 'Diagnostics',
          price: 0,
          providerId: id,
          popular: false
        });
      }
    }
  } catch (childErr) {
    console.error('Failed to create child document for provider:', childErr.message);
    // We don't fail the whole approval, but we log it
  }

  res.json({ 
    success: true, 
    message: `${type} approved successfully and profile activated`,
    data: provider 
  });
});

const rejectProvider = asyncHandler(async (req, res) => {
  const { id, type } = req.params;
  const { reason } = req.body;
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

  provider.verified = false;
  provider.status = 'rejected';
  provider.rejectionReason = reason || 'Documents do not meet requirements';
  await provider.save();

  // Reset user status so they can apply again
  await User.findByIdAndUpdate(provider.userId, { status: 'active' });

  res.json({ success: true, message: `${type} application rejected` });
});

const getAllBookings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 100 } = req.query;
  const skip = (page - 1) * limit;

  const total = await Booking.countDocuments();
  const bookings = await Booking.find()
    .populate('userId', 'name email')
    .populate({ 
      path: 'providerId', 
      populate: { path: 'userId', select: 'name' } 
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.json({ success: true, data: bookings, total, page: parseInt(page), limit: parseInt(limit) });
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
  rejectProvider,
  suspendProvider,
  activateProvider,
  removeProviderRole,
};

