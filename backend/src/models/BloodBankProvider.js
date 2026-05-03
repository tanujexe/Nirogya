const mongoose = require('mongoose');

const bloodBankProviderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  businessName: { type: String, required: true },
  description: { type: String },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  
  inventory: {
    'A+': { type: Number, default: 0 },
    'A-': { type: Number, default: 0 },
    'B+': { type: Number, default: 0 },
    'B-': { type: Number, default: 0 },
    'O+': { type: Number, default: 0 },
    'O-': { type: Number, default: 0 },
    'AB+': { type: Number, default: 0 },
    'AB-': { type: Number, default: 0 }
  },
  
  emergencySupply: { type: Boolean, default: true },
  deliveryAvailable: { type: Boolean, default: false },
  storageCertification: { type: String },
  workingHours: { type: String },
  
  rating: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 },
  
  verified: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'active', 'rejected', 'suspended'], default: 'pending' },
  licenseNumber: { type: String, required: true },
  documents: [{ type: String }],
  
}, { timestamps: true });

module.exports = mongoose.model('BloodBankProvider', bloodBankProviderSchema);
