const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  contact: { type: String, required: true },
  type: { type: String, default: 'Multi-Specialty' },
  beds: { type: Number, default: 100 },
  rating: { type: Number, default: 4.5 },
  image: { type: String },
  specialties: [{ type: String }],
  emergencyAvailable: { type: Boolean, default: true },
  location: {
    lat: Number,
    lng: Number
  }
}, { timestamps: true });

module.exports = mongoose.model('Hospital', hospitalSchema);
