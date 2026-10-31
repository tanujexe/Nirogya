const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { 
  getAllUsers, 
  getAllDoctors, 
  getDoctorById,
  verifyDoctor, 
  rejectDoctor,
  suspendDoctor,
  activateDoctor,
  updateDoctorByAdmin,
  deleteUser, 
  getAnalytics,
  getPendingDoctors,
  getAllBookings,
  getAllProviders,
  approveProvider,
  rejectProvider,
  suspendProvider,
  activateProvider,
  removeProviderRole
} = require('../controllers/adminController');

const router = express.Router();

router.use(protect, authorize('admin'));

// Analytics & Dash
router.get('/analytics', getAnalytics);
router.get('/bookings', getAllBookings);

// Doctor Management
router.get('/doctors', getAllDoctors);
router.get('/doctors/pending', getPendingDoctors);
router.get('/doctors/:id', getDoctorById);
router.patch('/doctors/:id/verify', verifyDoctor);
router.patch('/doctors/:id/reject', rejectDoctor);
router.patch('/doctors/:id/suspend', suspendDoctor);
router.patch('/doctors/:id/activate', activateDoctor);
router.patch('/doctors/:id', updateDoctorByAdmin);

// Provider Management (Generic)
router.get('/providers', getAllProviders);
router.patch('/providers/:type/:id/approve', approveProvider);
router.patch('/providers/:type/:id/reject', rejectProvider);
router.patch('/providers/:type/:id/suspend', suspendProvider);
router.patch('/providers/:type/:id/activate', activateProvider);
router.delete('/providers/:type/:id', removeProviderRole);

// User Management
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);

module.exports = router;
