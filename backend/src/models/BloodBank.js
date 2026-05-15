const mongoose = require('mongoose');

const bloodBankSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  address: { type: String, required: true },
  city:    { type: String },
  state:   { type: String },
  contact: { type: String, required: true },
  email:   { type: String },
  is24x7:  { type: Boolean, default: true },
  image:   { type: String },

  stock: {
    'A+':  { type: Number, default: 0, min: 0 },
    'A-':  { type: Number, default: 0, min: 0 },
    'B+':  { type: Number, default: 0, min: 0 },
    'B-':  { type: Number, default: 0, min: 0 },
    'O+':  { type: Number, default: 0, min: 0 },
    'O-':  { type: Number, default: 0, min: 0 },
    'AB+': { type: Number, default: 0, min: 0 },
    'AB-': { type: Number, default: 0, min: 0 },
  },

  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] }, // [longitude, latitude]
  },

  rating:       { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 },
  providerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'BloodBankProvider' },
}, { timestamps: true });

// Geo index for nearby search
bloodBankSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('BloodBank', bloodBankSchema);
