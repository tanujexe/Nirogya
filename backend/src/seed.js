/**
 * NirogyaSathi - Database Seed Script (Provider-First Edition)
 * Run with: node src/seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Hospital = require('./models/Hospital');
const Lab = require('./models/Lab');
const Booking = require('./models/Booking');
const BloodBank = require('./models/BloodBank');
const Ambulance = require('./models/Ambulance');
const AmbulanceProvider = require('./models/AmbulanceProvider');
const BloodBankProvider = require('./models/BloodBankProvider');
const LabProvider = require('./models/LabProvider');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nirogya';
const rawPassword = 'password123';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // ─── CLEAR ───────────────────────────────────────────────────────────────
  await Promise.all([
    User.deleteMany({}), Doctor.deleteMany({}), Hospital.deleteMany({}),
    Lab.deleteMany({}), Booking.deleteMany({}), BloodBank.deleteMany({}),
    Ambulance.deleteMany({}), AmbulanceProvider.deleteMany({}),
    BloodBankProvider.deleteMany({}), LabProvider.deleteMany({}),
  ]);
  console.log('🗑️  Cleared all collections');

  // ─── CORE USERS ──────────────────────────────────────────────────────────
  const admin = await User.create({
    name: 'Admin Nirogya', email: 'admin@nirogya.com', password: rawPassword,
    phone: '9000000001', role: 'admin', isVerified: true,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  });

  const patient = await User.create({
    name: 'Rahul Sharma', email: 'patient@nirogya.com', password: rawPassword,
    phone: '9000000002', role: 'user', isVerified: true,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rahul',
    address: { street: '12 MG Road', city: 'Gwalior', state: 'MP', zipCode: '474001' },
  });

  // ─── DOCTORS ─────────────────────────────────────────────────────────────
  const docUser = await User.create({
    name: 'Dr. Priya Verma', email: 'doctor@nirogya.com', password: rawPassword,
    phone: '9000000003', role: 'doctor', isVerified: true,
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80',
  });

  const doctor = await Doctor.create({
    userId: docUser._id, specialization: 'Cardiologist', experience: 12, fees: 800,
    clinicAddress: 'Fortis Medical Centre, Gwalior', rating: 4.9, reviewsCount: 312,
    verified: true, status: 'active', licenseNumber: 'MP-MD-2012-1045', degree: 'MBBS, MD',
    about: 'Expert in interventional cardiology and heart failure management.',
  });

  // ─── AMBULANCE PROVIDER ──────────────────────────────────────────────────
  const ambUser = await User.create({
    name: 'Swift Rescue', email: 'ambulance@nirogya.com', password: rawPassword,
    phone: '9876543211', role: 'ambulance', isVerified: true, status: 'active',
  });

  const ambProvider = await AmbulanceProvider.create({
    userId: ambUser._id, businessName: 'Swift Rescue & Trauma Care',
    phone: '9876543211', address: 'Indira Ganj, Gwalior', city: 'Gwalior', 
    state: 'Madhya Pradesh', status: 'active', verified: true,
    rating: 4.9, reviewsCount: 156, licenseNumber: 'AMB-MP-2023-001',
  });

  const ambulance = await Ambulance.create({
    providerId: ambProvider._id, driverId: ambUser._id,
    vehicleNumber: 'MP07-AB-1234', vehicleType: 'ICU',
    isOnline: true, available: true, isBusy: false,
    liveLocation: { type: 'Point', coordinates: [78.1734, 26.2298] }
  });

  // ─── BLOOD BANK PROVIDER ─────────────────────────────────────────────────
  const bloodUser = await User.create({
    name: 'City Life Blood Bank', email: 'bloodbank@nirogya.com', password: rawPassword,
    phone: '9876543212', role: 'bloodbank', isVerified: true, status: 'active',
  });

  const bbProvider = await BloodBankProvider.create({
    userId: bloodUser._id, businessName: 'City Life Central Blood Bank',
    phone: '9876543212', address: 'Victoria Market, Gwalior', city: 'Gwalior',
    state: 'Madhya Pradesh', status: 'active', verified: true,
    rating: 4.7, reviewsCount: 89, licenseNumber: 'BB-MP-2022-445',
  });

  const bloodBank = await BloodBank.create({
    name: 'City Life Blood Bank', address: 'Victoria Market, Gwalior',
    contact: '9876543212', providerId: bbProvider._id,
    stock: { 'A+': 15, 'O+': 30, 'B+': 20, 'AB+': 8 },
    location: { type: 'Point', coordinates: [78.1834, 26.2398] }
  });

  // ─── LAB PROVIDER ────────────────────────────────────────────────────────
  const labUser = await User.create({
    name: 'Precision Diagnostics', email: 'lab@nirogya.com', password: rawPassword,
    phone: '9876543213', role: 'lab', isVerified: true, status: 'active',
  });

  const labProvider = await LabProvider.create({
    userId: labUser._id, businessName: 'Precision Diagnostic Lab',
    phone: '9876543213', address: 'Nai Sadak, Gwalior', city: 'Gwalior',
    state: 'Madhya Pradesh', status: 'active', verified: true,
    rating: 4.8, reviewsCount: 210, licenseNumber: 'LAB-MP-2021-990',
  });

  const labTests = await Lab.insertMany([
    { testName: 'Complete Blood Count (CBC)', category: 'Blood Test', price: 299, providerId: labProvider._id, popular: true },
    { testName: 'Full Body Checkup', category: 'Health Package', price: 1499, providerId: labProvider._id, popular: true },
    { testName: 'Thyroid Profile', category: 'Hormone Test', price: 699, providerId: labProvider._id },
  ]);

  // ─── UNIFIED BOOKINGS ────────────────────────────────────────────────────
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

  await Booking.insertMany([
    {
      userId: patient._id, providerId: doctor._id, type: 'doctor',
      date: tomorrow, time: '10:00 AM', status: 'confirmed',
      notes: 'Monthly heart checkup'
    },
    {
      userId: patient._id, providerId: labProvider._id, type: 'lab',
      date: today, time: '09:00 AM', status: 'pending',
      details: { testName: 'Complete Blood Count (CBC)', testId: labTests[0]._id }
    },
    {
      userId: patient._id, providerId: ambProvider._id, type: 'ambulance',
      date: today, status: 'confirmed',
      pickupLocation: { address: 'User Home', coordinates: [78.17, 26.22] },
      destination: { address: 'City Hospital', coordinates: [78.18, 26.23] },
      details: { ambulanceType: 'ICU', fare: 2500 }
    }
  ]);

  console.log('✨ Seed complete! Use password: password123');
  await mongoose.disconnect();
}

seed().catch(err => { console.error('❌ Seed failed:', err); process.exit(1); });
