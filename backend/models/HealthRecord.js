const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    title: {
      type: String,
      required: [true, 'Please provide a title for the record'],
      trim: true,
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    recordType: {
      type: String,
      required: [true, 'Please specify record type'],
      enum: [
        'Prescription',
        'Lab Report',
        'X-Ray',
        'MRI Scan',
        'CT Scan',
        'Ultrasound',
        'ECG',
        'Medical Certificate',
        'Discharge Summary',
        'Vaccination Record',
        'Other',
      ],
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    fileType: {
      type: String,
      enum: ['pdf', 'image', 'document'],
      required: true,
    },
    fileSize: {
      type: Number, // in bytes
    },
    publicId: {
      type: String, // Cloudinary public ID for deletion
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    recordDate: {
      type: Date,
      required: [true, 'Please provide the date of the record'],
    },
    doctor: {
      name: String,
      specialization: String,
      hospital: String,
    },
    tags: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
healthRecordSchema.index({ user: 1, recordDate: -1 });
healthRecordSchema.index({ user: 1, recordType: 1 });
healthRecordSchema.index({ tags: 1 });

module.exports = mongoose.model('HealthRecord', healthRecordSchema);