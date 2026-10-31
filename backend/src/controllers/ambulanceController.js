const asyncHandler = require('../utils/asyncHandler');
const Ambulance = require('../models/Ambulance');
const AmbulanceProvider = require('../models/AmbulanceProvider');
const Booking = require('../models/Booking');
const User = require('../models/User');

// @desc    Get nearby available ambulances
// @route   GET /api/ambulance/nearby
// @access  Private
const getNearbyAmbulances = asyncHandler(async (req, res) => {
  const { lat, lng, type } = req.query;

  if (!lat || !lng) {
    res.status(400);
    throw new Error('Location coordinates are required');
  }

  // First find active/verified provider IDs
  const activeProviders = await require('../models/AmbulanceProvider').find({ 
    verified: true, 
    status: { $ne: 'suspended' } 
  }).select('_id');
  const activeProviderIds = activeProviders.map(p => p._id);

  const query = {
    providerId: { $in: activeProviderIds },
    isOnline: true,
    available: true,
    isBusy: false,
    liveLocation: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        $maxDistance: 50000 // 50km
      }
    }
  };

  if (type && type !== 'All' && type !== 'Basic') {
    query.vehicleType = type;
  }

  const ambulances = await Ambulance.find(query).limit(10).populate('providerId', 'businessName rating');

  res.json({
    success: true,
    data: ambulances
  });
});

// @desc    Create an ambulance booking request (Unified)
// @route   POST /api/ambulance/book
// @access  Private
const createBooking = asyncHandler(async (req, res) => {
  const { 
    pickupLocation, 
    destination, 
    ambulanceType, 
    distance, 
    duration, 
    fare 
  } = req.body;

  if (!pickupLocation || !destination || !ambulanceType) {
    res.status(400);
    throw new Error('Please provide all required booking details');
  }

  // Transform to GeoJSON Point format
  const formattedPickup = {
    address: pickupLocation.address,
    coordinates: {
      type: 'Point',
      coordinates: [parseFloat(pickupLocation.coordinates[0]), parseFloat(pickupLocation.coordinates[1])]
    }
  };

  const formattedDestination = {
    address: destination.address,
    coordinates: {
      type: 'Point',
      coordinates: [parseFloat(destination.coordinates[0]), parseFloat(destination.coordinates[1])]
    }
  };

  // Find nearby units using raw [lng, lat] array with safe fallback
  let nearbyAmbulances = [];
  try {
    nearbyAmbulances = await Ambulance.find({
      isOnline: true,
      available: true,
      isBusy: false,
      liveLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: pickupCoordsRaw
          },
          $maxDistance: 50000
        }
      }
    }).limit(10);
  } catch (geoErr) {
    console.warn('Geospatial ambulance search fallback:', geoErr.message);
    nearbyAmbulances = await Ambulance.find({
      isOnline: true,
      available: true,
      isBusy: false
    }).limit(10);
  }

  // Resolve assigned provider: either from nearby ambulance fleet or active provider in database
  let resolvedProviderId = nearbyAmbulances[0]?.providerId;
  if (!resolvedProviderId) {
    const defaultProvider = await AmbulanceProvider.findOne({ status: 'active' });
    resolvedProviderId = defaultProvider?._id;
  }

  // Create record in the UNIFIED Booking model with providerId assigned
  const booking = await Booking.create({
    userId: req.user._id,
    providerId: resolvedProviderId || undefined,
    providerModel: 'AmbulanceProvider',
    type: 'ambulance',
    status: 'pending',
    date: new Date(),
    time: new Date().toLocaleTimeString(),
    pickupLocation: formattedPickup,
    destination: formattedDestination,
    details: { 
      ambulanceType, 
      distance, 
      duration, 
      fare,
      category: 'emergency',
      pickupAddress: pickupLocation.address,
      destinationAddress: destination.address,
      patientName: req.user.name,
      patientPhone: req.user.phone
    }
  });

  // Dispatch via Socket
  const io = req.app.get('io');
  const ambulanceNS = io.of('/ambulance');
  
  const missionData = {
    bookingId: booking._id,
    booking,
    pickup: pickupLocation.address,
    destination: destination.address,
    pickupCoords: pickupLocation.coordinates,
    destCoords: destination.coordinates,
    distance,
    duration,
    fare,
    patientName: req.user.name,
    patientPhone: req.user.phone,
    ambulanceType
  };

  // 1. Notify individual nearby drivers
  nearbyAmbulances.forEach(amb => {
    ambulanceNS.to(`driver:${amb.driverId}`).emit('new_booking_request', missionData);
  });

  // 2. Broadcast to all active dispatch dashboard rooms
  ambulanceNS.to('ambulance_dispatch').emit('new_emergency_booking', missionData);
  ambulanceNS.emit('new_emergency_booking', missionData);
  if (resolvedProviderId) {
    ambulanceNS.to(`provider:${resolvedProviderId}`).emit('new_emergency_booking', missionData);
  }

  res.status(201).json({
    success: true,
    data: booking
  });
});

const respondToBooking = asyncHandler(async (req, res) => {
  const { action } = req.body; 
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error('Mission record not found');
  }

  if (booking.status !== 'pending') {
    res.status(400);
    throw new Error('Mission already claimed');
  }

  const ambulance = await Ambulance.findOne({ driverId: req.user._id });
  if (!ambulance) {
    res.status(404);
    throw new Error('No pilot profile linked to this account');
  }

  const io = req.app.get('io');
  const ambulanceNS = io.of('/ambulance');

  if (action === 'accept') {
    booking.status = 'confirmed'; // Unified status
    booking.providerId = ambulance.providerId;
    booking.ambulance = ambulance._id;
    await booking.save();

    ambulance.isBusy = true;
    ambulance.currentBooking = booking._id;
    await ambulance.save();

    // Notify patient
    ambulanceNS.to(`user:${booking.userId}`).emit('booking_accepted', {
      bookingId: booking._id,
      status: 'confirmed',
      ambulance: {
        driverName: req.user.name,
        phone: req.user.phone,
        vehicleNumber: ambulance.vehicleNumber,
        liveLocation: ambulance.liveLocation
      }
    });

    ambulanceNS.emit('booking_claimed', { bookingId: booking._id });
  }

  res.json({ success: true, data: booking });
});

// @desc    Update trip status (Driver)
// @route   PUT /api/ambulance/booking/:id/status
// @access  Private/Driver
const updateTripStatus = asyncHandler(async (req, res) => {
  const { status, location } = req.body;
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error('Mission not found');
  }

  booking.status = status;
  if (location) {
    booking.trackingHistory.push({
      status,
      location: {
        type: 'Point',
        coordinates: [location.lng, location.lat]
      }
    });
  }
  await booking.save();

  // If completed or cancelled, free the ambulance
  if (['completed', 'cancelled'].includes(status)) {
    await Ambulance.findOneAndUpdate(
      { currentBooking: booking._id },
      { isBusy: false, currentBooking: null }
    );
  }

  // Notify via Socket.IO
  const io = req.app.get('io');
  const ambulanceNS = io.of('/ambulance');
  
  ambulanceNS.to(`booking:${booking._id}`).emit('status_changed', {
    bookingId: booking._id,
    status,
    timestamp: new Date()
  });

  ambulanceNS.to(`user:${booking.userId}`).emit('booking_status_update', {
    bookingId: booking._id,
    status
  });

  res.json({ success: true, data: booking });
});

// @desc    Get booking details
// @route   GET /api/ambulance/booking/:id
// @access  Private
const getBookingDetails = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('ambulance')
    .populate('providerId', 'businessName phone')
    .populate('userId', 'name phone');

  if (!booking) {
    res.status(404);
    throw new Error('Mission record not found');
  }

  res.json({ success: true, data: booking });
});

// @desc    Get driver's current trip
// @route   GET /api/ambulance/driver/current-trip
// @access  Private/Driver
const getDriverCurrentTrip = asyncHandler(async (req, res) => {
  const ambulance = await Ambulance.findOne({ driverId: req.user._id });
  
  if (!ambulance || !ambulance.currentBooking) {
    return res.json({ success: true, data: null });
  }

  const booking = await Booking.findById(ambulance.currentBooking)
    .populate('userId', 'name phone');

  res.json({ success: true, data: booking });
});

module.exports = {
  getNearbyAmbulances,
  createBooking,
  respondToBooking,
  updateTripStatus,
  getBookingDetails,
  getDriverCurrentTrip
};
