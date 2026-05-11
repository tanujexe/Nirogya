const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ['user', 'doctor', 'ambulance', 'bloodbank', 'lab', 'admin'], default: 'user' },
  status: { type: String, enum: ['active', 'pending', 'suspended'], default: 'active' },
  age: { type: Number },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  isVerified: { type: Boolean, default: false },
  avatar: { type: String },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  emergencyContacts: [{
    name: String,
    phone: String,
    relation: String
  }],
  suspensionDetails: {
    isSuspended: { type: Boolean, default: false },
    type: { type: String, enum: ['suspension', 'removal', 'none'], default: 'none' },
    reason: String,
    date: Date,
    previousRole: String
  },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
