const mongoose = require('mongoose');

const ambulanceBookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ambulance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ambulance'
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AmbulanceProvider'
  },
  pickupLocation: {
    address: String,
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number] // [lng, lat]
    }
  },
  destination: {
    address: String,
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number] // [lng, lat]
    }
  },
  ambulanceType: {
    type: String,
    enum: ['Basic', 'Oxygen', 'ICU', 'Ventilator'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'assigned', 'reaching', 'picked', 'reached', 'completed', 'cancelled'],
    default: 'pending'
  },
  fare: {
    type: Number,
    default: 0
  },
  distance: {
    type: String // e.g., "5.2 km"
  },
  duration: {
    type: String // e.g., "15 mins"
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  otp: {
    type: String
  },
  trackingHistory: [{
    status: String,
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number]
    },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

ambulanceBookingSchema.index({ "pickupLocation.coordinates": '2dsphere' });
ambulanceBookingSchema.index({ "destination.coordinates": '2dsphere' });

module.exports = mongoose.model('AmbulanceBooking', ambulanceBookingSchema);
