const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor reference is required'],
    },
    appointmentDate: {
      type: Date,
      required: [true, 'Appointment date is required'],
    },
    timeSlot: {
      type: String,
      required: [true, 'Time slot is required'],
      // Format: "09:00 AM - 10:00 AM"
    },
    reason: {
      type: String,
      required: [true, 'Please provide reason for visit'],
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Refunded'],
      default: 'Pending',
    },
    amount: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    cancelReason: {
      type: String,
    },
    cancelledBy: {
      type: String,
      enum: ['user', 'doctor', 'admin'],
    },
    cancelledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
bookingSchema.index({ user: 1, appointmentDate: -1 });
bookingSchema.index({ doctor: 1, appointmentDate: 1, status: 1 });
bookingSchema.index({ status: 1 });

// Prevent duplicate bookings for same doctor, date, and time
bookingSchema.index(
  { doctor: 1, appointmentDate: 1, timeSlot: 1 },
  { 
    unique: true,
    partialFilterExpression: { status: { $in: ['Pending', 'Confirmed'] } }
  }
);

module.exports = mongoose.model('Booking', bookingSchema);