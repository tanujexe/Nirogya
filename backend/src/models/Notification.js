const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  type:    {
    type: String,
    enum: ['booking', 'cancellation', 'reminder', 'system', 'review', 'verification'],
    default: 'system'
  },
  link:    { type: String },  // optional deep-link, e.g. '/bookings/123'
  read:    { type: Boolean, default: false },
}, { timestamps: true });

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
