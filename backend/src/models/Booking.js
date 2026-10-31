const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // providerId can point to Doctor, AmbulanceProvider, BloodBankProvider, LabProvider, or Hospital
  providerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: false, 
    refPath: 'providerModel' 
  },
  providerModel: {
    type: String,
    required: false,
    enum: ['Doctor', 'AmbulanceProvider', 'BloodBankProvider', 'LabProvider', 'Hospital']
  },
  type: {
    type: String,
    enum: ['doctor', 'ambulance', 'blood', 'lab', 'donation', 'diagnostic', 'hospital'],
    required: true,
    default: 'doctor'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  date:     { type: Date, required: true },
  timeSlot: { type: String },   // e.g. "10:00 AM - 10:30 AM" — kept for doctor/lab
  notes:    { type: String },   // reason / symptoms / special request
  cancelReason: { type: String },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  // For doctor bookings — shared medical reports
  sharedReports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MedicalRecord' }],
  
  // For Ambulance/Emergency
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
  ambulance: { type: mongoose.Schema.Types.ObjectId, ref: 'Ambulance' },
  trackingHistory: [{
    status: String,
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number]
    },
    timestamp: { type: Date, default: Date.now }
  }],

  // Flexible extra details per booking type
  details: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

// Compound index: one active slot per provider per time — prevents double booking
bookingSchema.index(
  { providerId: 1, date: 1, timeSlot: 1 },
  { 
    unique: true, 
    partialFilterExpression: { 
      status: { $nin: ['cancelled'] },
      providerId: { $exists: true }
    } 
  }
);

// Index for user lookups
bookingSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
