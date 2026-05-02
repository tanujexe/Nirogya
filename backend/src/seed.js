/**
 * NirogyaSathi - Database Seed Script
 * Run with: node src/seed.js
 * Clears and repopulates all collections with realistic dummy data.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

const hashPassword = async (pw) => bcrypt.hash(pw, 10);

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB:', MONGO_URI);

  // ─── CLEAR ───────────────────────────────────────────────────────────────
  await Promise.all([
    User.deleteMany({}),
    Doctor.deleteMany({}),
    Hospital.deleteMany({}),
    Lab.deleteMany({}),
    Booking.deleteMany({}),
    BloodBank.deleteMany({}),
    Ambulance.deleteMany({}),
    AmbulanceProvider.deleteMany({}),
    BloodBankProvider.deleteMany({}),
    LabProvider.deleteMany({}),
  ]);
  console.log('🗑️  Cleared all collections');

  // ─── USERS ────────────────────────────────────────────────────────────────
  const rawPassword = 'password123';

  const adminUser = await User.create({
    name: 'Admin Nirogya',
    email: 'admin@nirogya.com',
    password: rawPassword,
    phone: '9000000001',
    role: 'admin',
    isVerified: true,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  });

  const patientUser = await User.create({
    name: 'Rahul Sharma',
    email: 'patient@nirogya.com',
    password: rawPassword,
    phone: '9000000002',
    role: 'user',
    isVerified: true,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rahul',
    address: { street: '12 MG Road', city: 'Bengaluru', state: 'Karnataka', zipCode: '560001' },
  });

  const doctorUsersData = [
    {
      name: 'Dr. Priya Verma',
      email: 'priya.verma@nirogya.com',
      password: rawPassword,
      phone: '9000000003',
      role: 'doctor',
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80',
    },
    {
      name: 'Dr. Arjun Mehta',
      email: 'arjun.mehta@nirogya.com',
      password: rawPassword,
      phone: '9000000004',
      role: 'doctor',
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80',
    },
    {
      name: 'Dr. Sneha Iyer',
      email: 'sneha.iyer@nirogya.com',
      password: rawPassword,
      phone: '9000000005',
      role: 'doctor',
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80',
    },
    {
      name: 'Dr. Karan Singh',
      email: 'karan.singh@nirogya.com',
      password: rawPassword,
      phone: '9000000006',
      role: 'doctor',
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80',
    },
    {
      name: 'Dr. Ananya Das',
      email: 'ananya.das@nirogya.com',
      password: rawPassword,
      phone: '9000000007',
      role: 'doctor',
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1643297654416-05795d62e39c?w=400&q=80',
    },
    {
      name: 'Dr. Rohit Nair',
      email: 'rohit.nair@nirogya.com',
      password: rawPassword,
      phone: '9000000008',
      role: 'doctor',
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&q=80',
    },
  ];

  const doctorUsers = [];
  for (const data of doctorUsersData) {
    const doc = await User.create(data);
    doctorUsers.push(doc);
  }

  console.log(`👤 Created ${doctorUsers.length + 2} users`);

  // ─── DOCTORS ─────────────────────────────────────────────────────────────
  const doctorData = [
    {
      userId: doctorUsers[0]._id,
      specialization: 'Cardiologist',
      experience: 12,
      fees: 800,
      clinicAddress: 'Suite 301, Fortis Medical Centre, Koramangala, Bengaluru',
      rating: 4.9,
      reviewsCount: 312,
      verified: true,
      licenseNumber: 'KAR-MD-2012-1045',
      degree: 'MBBS, MD',
      about: 'Dr. Priya Verma is a board-certified cardiologist with 12 years of experience in treating complex cardiac conditions including heart failure, arrhythmias, and coronary artery disease.',
      qualification: 'MBBS (AIIMS Delhi), MD Cardiology (PGI Chandigarh), Fellowship in Interventional Cardiology (Cleveland Clinic, USA)',
    },
    {
      userId: doctorUsers[1]._id,
      specialization: 'Orthopedic Surgeon',
      experience: 15,
      fees: 1000,
      clinicAddress: 'Block B, Apollo Spectra, Whitefield, Bengaluru',
      rating: 4.8,
      reviewsCount: 248,
      verified: true,
      licenseNumber: 'KAR-MS-2015-8821',
      degree: 'MBBS, MS',
      about: 'Dr. Rajesh Kumar specializes in musculoskeletal disorders and sports injuries. He has successfully performed over 2,000 joint replacement surgeries.',
      qualification: 'MBBS, MS Orthopedics (KEM Hospital, Mumbai), Fellowship in Joint Replacement (Germany)',
    },
    {
      userId: doctorUsers[2]._id,
      specialization: 'Dermatologist',
      experience: 8,
      fees: 600,
      clinicAddress: 'No. 45, Indiranagar, Bengaluru',
      rating: 4.7,
      reviewsCount: 195,
      verified: true,
      licenseNumber: 'KAR-MD-2016-2234',
      about: 'Dr. Sneha Iyer is a leading dermatologist specializing in medical and cosmetic dermatology, including acne, eczema, psoriasis, hair loss, and anti-aging treatments.',
      qualification: 'MBBS (Bangalore Medical College), MD Dermatology (NIMHANS), Diploma in Cosmetic Dermatology',
    },
    {
      userId: doctorUsers[3]._id,
      specialization: 'Pediatrician',
      experience: 10,
      fees: 500,
      clinicAddress: 'Rainbow Children Hospital, HSR Layout, Bengaluru',
      rating: 4.9,
      reviewsCount: 420,
      verified: true,
      licenseNumber: 'KAR-MD-2014-3312',
      about: 'Dr. Karan Singh is a compassionate pediatrician with a decade of experience caring for children from newborns to adolescents. He specializes in developmental pediatrics.',
      qualification: 'MBBS (St. Johns Medical College), MD Pediatrics (AIIMS), Fellowship in Neonatology',
    },
    {
      userId: doctorUsers[4]._id,
      specialization: 'Gynecologist',
      experience: 14,
      fees: 750,
      clinicAddress: 'Motherhood Hospital, Bannerghatta Road, Bengaluru',
      rating: 4.8,
      reviewsCount: 367,
      verified: true,
      licenseNumber: 'KAR-MS-2010-4156',
      about: 'Dr. Ananya Das is an experienced gynecologist and obstetrician with expertise in high-risk pregnancies, minimally invasive surgeries, and fertility treatments.',
      qualification: 'MBBS, MS Gynecology (Maulana Azad Medical College, Delhi), Fellowship in Reproductive Medicine',
    },
    {
      userId: doctorUsers[5]._id,
      specialization: 'Neurologist',
      experience: 11,
      fees: 900,
      clinicAddress: 'NIMHANS, Hosur Road, Bengaluru',
      rating: 4.7,
      reviewsCount: 178,
      verified: true,
      licenseNumber: 'KAR-DM-2013-5089',
      about: 'Dr. Rohit Nair is a leading neurologist specializing in stroke management, epilepsy, multiple sclerosis, Parkinson\'s disease, and headache disorders.',
      qualification: 'MBBS, MD Internal Medicine, DM Neurology (NIMHANS Bengaluru)',
    },
  ];

  const doctors = await Doctor.insertMany(doctorData);
  console.log(`👨‍⚕️ Created ${doctors.length} doctors`);

  // ─── HOSPITALS ───────────────────────────────────────────────────────────
  const hospitals = await Hospital.insertMany([
    {
      name: 'Fortis Hospital Bengaluru',
      address: 'No. 14, Cunningham Road, Vasanth Nagar, Bengaluru',
      contact: '+91-80-6621-4444',
      type: 'Multi-Specialty',
      beds: 400,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1587350859728-117622bc937e?w=800&q=80',
      specialties: ['Cardiology', 'Neurology', 'Oncology', 'Orthopedics', 'Nephrology'],
      emergencyAvailable: true,
      location: { lat: 12.9792, lng: 77.5913 },
    },
    {
      name: 'Apollo Spectra Whitefield',
      address: 'No. 03, Whitefield Main Road, Bengaluru',
      contact: '+91-80-6060-3100',
      type: 'Super Specialty',
      beds: 280,
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80',
      specialties: ['Bariatrics', 'Urology', 'Laparoscopy', 'ENT', 'Spine Surgery'],
      emergencyAvailable: true,
      location: { lat: 12.9698, lng: 77.7499 },
    },
    {
      name: 'Narayana Health City',
      address: '258/A, Bommasandra Industrial Area, Anekal Taluk, Bengaluru',
      contact: '+91-80-7122-2222',
      type: 'Super Specialty',
      beds: 1400,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&q=80',
      specialties: ['Cardiac Surgery', 'Transplant', 'Oncology', 'Pediatric Surgery'],
      emergencyAvailable: true,
      location: { lat: 12.8364, lng: 77.6749 },
    },
    {
      name: 'Manipal Hospital HAL Airport Road',
      address: '98, HAL Airport Road, Bengaluru',
      contact: '+91-80-2502-4444',
      type: 'Multi-Specialty',
      beds: 600,
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&q=80',
      specialties: ['IVF & Fertility', 'Oncology', 'Cardiology', 'Neuroscience'],
      emergencyAvailable: true,
      location: { lat: 12.9581, lng: 77.6481 },
    },
    {
      name: 'Rainbow Children\'s Hospital HSR',
      address: '78, Sector 1, HSR Layout, Bengaluru',
      contact: '+91-80-6767-9999',
      type: 'Pediatric Specialty',
      beds: 120,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
      specialties: ['Neonatology', 'Pediatric Surgery', 'Child Neurology', 'Vaccination'],
      emergencyAvailable: true,
      location: { lat: 12.9116, lng: 77.6411 },
    },
  ]);
  console.log(`🏥 Created ${hospitals.length} hospitals`);

  // ─── LAB TESTS ───────────────────────────────────────────────────────────
  const labTests = await Lab.insertMany([
    { testName: 'Complete Blood Count (CBC)', category: 'Blood Test', price: 299, duration: '6 hours', popular: true, fasting: false, description: 'Measures the types and number of cells in blood including RBCs, WBCs, and platelets.' },
    { testName: 'Lipid Profile', category: 'Blood Test', price: 499, duration: '12 hours', popular: true, fasting: true, description: 'Measures cholesterol and triglycerides to assess cardiovascular risk.' },
    { testName: 'Blood Glucose Fasting', category: 'Blood Test', price: 99, duration: '4 hours', popular: true, fasting: true, description: 'Measures fasting blood sugar to diagnose diabetes.' },
    { testName: 'HbA1c (Glycated Hemoglobin)', category: 'Blood Test', price: 399, duration: '8 hours', popular: false, fasting: false, description: 'Measures average blood sugar over the past 3 months.' },
    { testName: 'Thyroid Profile (T3, T4, TSH)', category: 'Hormone Test', price: 699, duration: '24 hours', popular: true, fasting: false, description: 'Comprehensive thyroid function test.' },
    { testName: 'Testosterone Total', category: 'Hormone Test', price: 599, duration: '24 hours', popular: false, fasting: false, description: 'Measures testosterone levels in the blood.' },
    { testName: 'Cortisol (Morning)', category: 'Hormone Test', price: 499, duration: '24 hours', popular: false, fasting: true, description: 'Evaluates adrenal gland function.' },
    { testName: 'Vitamin D (25-OH)', category: 'Vitamin Test', price: 799, duration: '48 hours', popular: true, fasting: false, description: 'Detects vitamin D deficiency.' },
    { testName: 'Vitamin B12', category: 'Vitamin Test', price: 499, duration: '24 hours', popular: true, fasting: false, description: 'Measures vitamin B12 levels essential for nerve function.' },
    { testName: 'Iron Studies (Ferritin, Serum Iron)', category: 'Vitamin Test', price: 599, duration: '24 hours', popular: false, fasting: false, description: 'Evaluates iron stores in the body.' },
    { testName: 'Full Body Checkup - Basic', category: 'Health Package', price: 1499, duration: '48 hours', popular: true, fasting: true, description: 'Includes CBC, Blood Glucose, Lipid Profile, Liver & Kidney function, Urine analysis.' },
    { testName: 'Cardiac Health Package', category: 'Health Package', price: 2499, duration: '48 hours', popular: true, fasting: true, description: 'Comprehensive heart health assessment including ECG, Echo, and lipid studies.' },
    { testName: 'Diabetes Care Package', category: 'Health Package', price: 999, duration: '24 hours', popular: false, fasting: true, description: 'Includes Fasting Glucose, HbA1c, Insulin, Urine Microalbumin.' },
    { testName: 'Liver Function Test (LFT)', category: 'Blood Test', price: 349, duration: '8 hours', popular: false, fasting: false, description: 'Checks liver health markers including SGOT, SGPT, bilirubin.' },
    { testName: 'Kidney Function Test (KFT)', category: 'Blood Test', price: 349, duration: '8 hours', popular: false, fasting: false, description: 'Measures creatinine, urea, and electrolytes to assess kidney function.' },
  ]);
  console.log(`🧪 Created ${labTests.length} lab tests`);

  // ─── BOOKINGS ─────────────────────────────────────────────────────────────
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);

  await Booking.insertMany([
    {
      userId: patientUser._id,
      doctorId: doctors[0]._id,
      date: tomorrow,
      time: '10:00 AM',
      notes: 'Chest pain and mild breathlessness for last 2 weeks',
      status: 'confirmed',
    },
    {
      userId: patientUser._id,
      doctorId: doctors[2]._id,
      date: nextWeek,
      time: '11:30 AM',
      notes: 'Persistent acne breakout, need consultation',
      status: 'pending',
    },
  ]);
  console.log('📅 Created sample bookings');

  // ─── BLOOD BANKS ─────────────────────────────────────────────────────────
  try {
    await BloodBank.insertMany([
      { name: 'Rotary Blood Bank Bengaluru', address: 'No. 8, 1st Cross, Sadashivanagar, Bengaluru', contact: '+91-80-2361-7007', availableGroups: ['A+', 'A-', 'B+', 'O+', 'O-', 'AB+'] },
      { name: 'Indian Red Cross Blood Bank', address: 'Kolar Road, Shivajinagar, Bengaluru', contact: '+91-80-2235-9013', availableGroups: ['A+', 'B+', 'B-', 'O+', 'AB+', 'AB-'] },
    ]);
    console.log('🩸 Created blood banks');
  } catch (e) {
    console.log('⚠️  Skipped blood banks (schema mismatch):', e.message.substring(0, 80));
  }

  // ─── AMBULANCES ──────────────────────────────────────────────────────────
  try {
    await Ambulance.insertMany([
      { vehicleNumber: 'KA01-AB-1234', driverName: 'Suresh Kumar', phone: '9900011223', available: true, liveLocation: { lat: 12.9716, lng: 77.5946 } },
      { vehicleNumber: 'KA01-CD-5678', driverName: 'Ravi Shankar', phone: '9900044556', available: true, liveLocation: { lat: 12.9352, lng: 77.6245 } },
    ]);
    console.log('🚑 Created ambulances');
  } catch (e) {
    console.log('⚠️  Skipped ambulances (schema mismatch):', e.message.substring(0, 80));
  }

  // ─── AMBULANCE PROVIDERS ──────────────────────────────────────────────────
  const ambUser = await User.create({
    name: 'Swift Rescue Services',
    email: 'swift@nirogya.com',
    password: rawPassword,
    phone: '9876543211',
    role: 'ambulance',
    isVerified: true,
    status: 'active',
  });

  await AmbulanceProvider.create({
    userId: ambUser._id,
    businessName: 'Swift Rescue & Trauma Care',
    description: 'Leading emergency ambulance service in Bengaluru with 24/7 ICU support.',
    phone: '9876543211',
    address: 'Indiranagar Main Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    vehicleCount: 8,
    vehicleTypes: ['Basic', 'Oxygen', 'ICU'],
    driverCount: 12,
    gpsEnabled: true,
    is24x7: true,
    serviceZones: ['Indiranagar', 'Koramangala', 'HSR'],
    rating: 4.9,
    reviewsCount: 156,
    licenseNumber: 'AMB-KAR-2023-001',
    status: 'active',
    verified: true,
  });

  // ─── BLOOD BANK PROVIDERS ─────────────────────────────────────────────────
  const bloodUser = await User.create({
    name: 'City Life Blood Bank',
    email: 'cityblood@nirogya.com',
    password: rawPassword,
    phone: '9876543212',
    role: 'bloodbank',
    isVerified: true,
    status: 'active',
  });

  await BloodBankProvider.create({
    userId: bloodUser._id,
    businessName: 'City Life Central Blood Bank',
    description: 'A state-of-the-art blood storage and donation center.',
    phone: '9876543212',
    address: 'Near Victoria Hospital, Fort',
    city: 'Bengaluru',
    state: 'Karnataka',
    inventory: {
      'A+': 15, 'A-': 4, 'B+': 20, 'B-': 6,
      'O+': 30, 'O-': 12, 'AB+': 8, 'AB-': 3
    },
    emergencySupply: true,
    deliveryAvailable: true,
    storageCertification: 'NABL Certified',
    rating: 4.7,
    reviewsCount: 89,
    licenseNumber: 'BB-KAR-2022-445',
    status: 'active',
    verified: true,
  });

  // ─── LAB PROVIDERS ────────────────────────────────────────────────────────
  const labUser = await User.create({
    name: 'Precision Diagnostics',
    email: 'precision@nirogya.com',
    password: rawPassword,
    phone: '9876543213',
    role: 'lab',
    isVerified: true,
    status: 'active',
  });

  await LabProvider.create({
    userId: labUser._id,
    businessName: 'Precision Diagnostic & Research Lab',
    description: 'Providing accurate and timely diagnostic reports for over 15 years.',
    phone: '9876543213',
    address: 'Koramangala 4th Block',
    city: 'Bengaluru',
    state: 'Karnataka',
    testCategories: ['Blood Test', 'Pathology', 'Radiology', 'Molecular'],
    tests: [
      { name: 'Full Body Profile', price: 1999, category: 'Package' },
      { name: 'Thyroid Panel', price: 599, category: 'Hormone' }
    ],
    homeCollection: true,
    reportTime: '12-24 hours',
    certifications: ['NABL', 'ISO 9001'],
    rating: 4.8,
    reviewsCount: 210,
    licenseNumber: 'LAB-KAR-2021-990',
    status: 'active',
    verified: true,
  });

  console.log('✨ Created new premium provider data');

  console.log('\n✅ Seed complete! Login credentials:');
  console.log('────────────────────────────────────────');
  console.log('Admin  → admin@nirogya.com  / password123');
  console.log('Patient→ patient@nirogya.com / password123');
  console.log('Doctor → priya.verma@nirogya.com / password123');
  console.log('────────────────────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
