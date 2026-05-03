const mongoose = require('mongoose');

const ambulanceProviderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  businessName: { type: String, required: true },
  description: { type: String },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  
  vehicleCount: { type: Number, default: 1 },
  vehicleTypes: [{ type: String }], // Basic, Oxygen, ICU
  driverCount: { type: Number },
  gpsEnabled: { type: Boolean, default: false },
  is24x7: { type: Boolean, default: true },
  serviceZones: [{ type: String }],
  
  rating: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 },
  isOnline: { type: Boolean, default: true },
  
  verified: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'active', 'rejected', 'suspended'], default: 'pending' },
  
  // Badges
  hasVerifiedBadge: { type: Boolean, default: false },
  hasServicesBadge: { type: Boolean, default: false },
  
  licenseNumber: { type: String, required: true },
  documents: [{ type: String }], // URLs to Cloudinary
  
}, { timestamps: true });

module.exports = mongoose.model('AmbulanceProvider', ambulanceProviderSchema);
