const mongoose = require('mongoose');

const labTestSchema = new mongoose.Schema(
  {
    testName: {
      type: String,
      required: [true, 'Please provide test name'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please specify test category'],
      enum: [
        'Blood Test',
        'Urine Test',
        'Imaging',
        'Pathology',
        'Radiology',
        'Cardiology',
        'Diagnostic',
        'Screening',
        'Other',
      ],
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide test price'],
      min: [0, 'Price cannot be negative'],
    },
    preparationRequired: {
      type: String,
      maxlength: [500, 'Preparation instructions cannot exceed 500 characters'],
    },
    reportDeliveryTime: {
      type: String, // e.g., "24 hours", "2-3 days"
      default: '24 hours',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const labBookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabTest',
      required: [true, 'Test reference is required'],
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required'],
    },
    timeSlot: {
      type: String,
      required: [true, 'Time slot is required'],
    },
    location: {
      type: String,
      enum: ['Home Collection', 'Lab Visit'],
      required: [true, 'Please specify collection location'],
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Sample Collected', 'Processing', 'Completed', 'Cancelled'],
      default: 'Scheduled',
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
    reportUrl: {
      type: String, // URL to the uploaded report
    },
    reportPublicId: {
      type: String, // Cloudinary public ID
    },
    reportUploadedAt: {
      type: Date,
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
labTestSchema.index({ category: 1, isActive: 1 });
labTestSchema.index({ testName: 'text' });

labBookingSchema.index({ user: 1, scheduledDate: -1 });
labBookingSchema.index({ test: 1, status: 1 });
labBookingSchema.index({ status: 1 });

const LabTest = mongoose.model('LabTest', labTestSchema);
const LabBooking = mongoose.model('LabBooking', labBookingSchema);

module.exports = { LabTest, LabBooking };