const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  businessName: { type: String }, // For professional branding
  specialization: { type: String, required: true },
  experience: { type: Number, required: true },
  fees: { type: Number, required: true },
  qualification: { type: String },
  degree: { type: String },
  about: { type: String },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  availableSlots: [{
    date: String,
    times: [String]
  }],
  rating: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'active', 'rejected', 'suspended'], default: 'pending' },
  
  // Badges
  hasVerifiedBadge: { type: Boolean, default: false },
  hasServicesBadge: { type: Boolean, default: false },
  
  rejectionReason: { type: String },
  suspendedReason: { type: String },
  licenseNumber: { type: String, required: true },
  location: {
    lat: Number,
    lng: Number
  }
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);
