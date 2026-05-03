const mongoose = require('mongoose');

const bloodBankSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  stock: {
    'A+': { type: Number, default: 0 },
    'A-': { type: Number, default: 0 },
    'B+': { type: Number, default: 0 },
    'B-': { type: Number, default: 0 },
    'O+': { type: Number, default: 0 },
    'O-': { type: Number, default: 0 },
    'AB+': { type: Number, default: 0 },
    'AB-': { type: Number, default: 0 }
  },
  contact: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('BloodBank', bloodBankSchema);
