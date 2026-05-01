const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide doctor name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide email'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      default: 'doctor',
    },
    phone: {
      type: String,
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
    },
    specialization: {
      type: String,
      enum: [
        'General Physician',
        'Cardiologist',
        'Dermatologist',
        'Pediatrician',
        'Gynecologist',
        'Orthopedic',
        'Neurologist',
        'Psychiatrist',
        'Dentist',
        'ENT Specialist',
        'Ophthalmologist',
        'Urologist',
        'Gastroenterologist',
        'Endocrinologist',
        'Other',
      ],
      default: 'General Physician',
    },
    qualification: {
      type: String,
    },
    experience: {
      type: Number,
      min: [0, 'Experience cannot be negative'],
      default: 0,
    },
    fees: {
      type: Number,
      min: [0, 'Fees cannot be negative'],
      default: 500,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    profileImage: {
      type: String,
      default: 'https://via.placeholder.com/150',
    },
    about: {
      type: String,
      maxlength: [500, 'About section cannot exceed 500 characters'],
    },
    availability: {
      monday: { available: { type: Boolean, default: true }, slots: [String] },
      tuesday: { available: { type: Boolean, default: true }, slots: [String] },
      wednesday: { available: { type: Boolean, default: true }, slots: [String] },
      thursday: { available: { type: Boolean, default: true }, slots: [String] },
      friday: { available: { type: Boolean, default: true }, slots: [String] },
      saturday: { available: { type: Boolean, default: false }, slots: [String] },
      sunday: { available: { type: Boolean, default: false }, slots: [String] },
    },
    hospital: {
      name: String,
      address: String,
      city: String,
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

// Hash password before saving
doctorSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
doctorSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Don't return password in JSON
doctorSchema.methods.toJSON = function () {
  const doctor = this.toObject();
  delete doctor.password;
  return doctor;
};

// Index for faster queries
doctorSchema.index({ specialization: 1, isActive: 1 });
doctorSchema.index({ rating: -1 });

module.exports = mongoose.model('Doctor', doctorSchema);