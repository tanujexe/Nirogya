const mongoose = require('mongoose');

const labProviderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  businessName: { type: String, required: true },
  description: { type: String },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  
  testCategories: [{ type: String }],
  tests: [{
    name: String,
    price: Number,
    category: String,
    description: String
  }],
  homeCollection: { type: Boolean, default: true },
  reportTime: { type: String, default: '24 hours' },
  certifications: [{ type: String }], // e.g., NABL
  
  rating: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 },
  
  verified: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'active', 'rejected', 'suspended'], default: 'pending' },
  licenseNumber: { type: String, required: true },
  documents: [{ type: String }],
  
}, { timestamps: true });

module.exports = mongoose.model('LabProvider', labProviderSchema);
