const mongoose = require('mongoose');

const ambulanceSchema = new mongoose.Schema({
  // Linked to the AmbulanceProvider company
  providerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'AmbulanceProvider' },
  driverId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vehicleNumber:{ type: String, required: true, unique: true },
  vehicleType:  { type: String, enum: ['Basic', 'Oxygen', 'ICU', 'Ventilator'], default: 'Basic' },
  driverName:   { type: String }, // cached for speed
  phone:        { type: String },  // cached for speed
  available:    { type: Boolean, default: true },
  isOnline:     { type: Boolean, default: false }, // driver currently active/online
  socketId:     { type: String }, // live socket connection ID for real-time

  liveLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    updatedAt: { type: Date }
  },
  isBusy: { type: Boolean, default: false },
  currentBooking: { type: mongoose.Schema.Types.ObjectId, ref: 'AmbulanceBooking' }
}, { timestamps: true });

ambulanceSchema.index({ liveLocation: '2dsphere' });

module.exports = mongoose.model('Ambulance', ambulanceSchema);
