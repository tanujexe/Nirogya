const mongoose = require('mongoose');

// Each document is one lab test (not one lab with many tests)
const labSchema = new mongoose.Schema({
  testName: { type: String, required: true },
  category: { type: String, required: true, enum: ['Blood Test', 'Hormone Test', 'Vitamin Test', 'Health Package', 'Other'] },
  price: { type: Number, required: true },
  duration: { type: String, default: '24 hours' },
  description: { type: String },
  popular: { type: Boolean, default: false },
  fasting: { type: Boolean, default: false },
  homeCollection: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Lab', labSchema);
