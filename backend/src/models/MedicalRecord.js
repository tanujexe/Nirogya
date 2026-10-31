const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true, trim: true },
  category:    {
    type: String,
    required: true,
    enum: ['prescriptions', 'lab_reports', 'medical_history', 'MRI', 'CT Scan', 'X-Ray', 'Blood Test', 'ECG', 'Ultrasound', 'Other']
  },
  hospitalName: { type: String },
  reportDate:   { type: Date, default: Date.now },
  notes:        { type: String },
  fileUrl:      { type: String, required: true },
  fileType:     { type: String }, // 'image/jpeg', 'application/pdf', etc.
  cloudinaryId: { type: String }, // for deletion from Cloudinary
  uploadedBy:   { type: mongoose.Schema.Types.ObjectId, refPath: 'uploaderModel' },
  uploaderModel:{ type: String, enum: ['User', 'Doctor'] },
  extractedText: { type: String },
  aiSummary: { type: mongoose.Schema.Types.Mixed },
  summaryGenerated: { type: Boolean, default: false },
  sharedWithDoctors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }],
}, { timestamps: true });

// Index for fast user-based queries
medicalRecordSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
