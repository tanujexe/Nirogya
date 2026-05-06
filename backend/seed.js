const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');
const Doctor = require('./src/models/Doctor');
const Ambulance = require('./src/models/Ambulance');
const AmbulanceProvider = require('./src/models/AmbulanceProvider');
const BloodBankProvider = require('./src/models/BloodBankProvider');
const LabProvider = require('./src/models/LabProvider');
const Lab = require('./src/models/Lab');

dotenv.config();

const specializations = [
  'Cardiologist', 'Neurologist', 'Dermatologist', 'Pediatrician', 'Psychiatrist',
  'Orthopedist', 'Gynecologist', 'Oncologist', 'Endocrinologist', 'Gastroenterologist',
  'Ophthalmologist', 'ENT Specialist', 'Urologist', 'Pulmonologist', 'Rheumatologist',
  'Nephrologist', 'Hematologist', 'General Physician', 'Dentist', 'Surgeon'
];

const seedData = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nirogyasathi');
    console.log(`Connected to MongoDB: ${conn.connection.host}`);

    // CLEAR ALL DATA
    console.log('Clearing old data...');
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Ambulance.deleteMany({});
    await AmbulanceProvider.deleteMany({});
    await BloodBankProvider.deleteMany({});
    await LabProvider.deleteMany({});
    await Lab.deleteMany({});

    // 1. Create Base Users
    console.log('Creating base users...');
    const adminUser = await User.create({
      name: 'Nirogya Admin',
      email: 'admin@nirogyasathi.com',
      password: 'password123',
      role: 'admin'
    });

    const demoUser = await User.create({
      name: 'Nirogya User',
      email: 'user@nirogyasathi.com',
      password: 'password123',
      role: 'user'
    });

    const providerUser = await User.create({
      name: 'Nirogya Provider',
      email: 'provider@nirogyasathi.com',
      password: 'password123',
      role: 'user'
    });

    // 2. Seed 20 Doctors
    console.log('Seeding 20 Doctors...');
    for (let i = 0; i < specializations.length; i++) {
      const spec = specializations[i];
      const name = `Dr. ${spec} ${i + 1}`;
      const email = `doctor${i + 1}@nirogyasathi.com`;

      const user = await User.create({
        name,
        email,
        password: 'password123',
        role: 'doctor',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(' ', '')}`
      });

      await Doctor.create({
        userId: user._id,
        specialization: spec,
        experience: Math.floor(Math.random() * 20) + 5,
        fees: Math.floor(Math.random() * 1000) + 500,
        qualification: 'MBBS, MD',
        degree: 'MD',
        about: `Dedicated ${spec} with a passion for patient care. Specialist in ${spec.toLowerCase()} related treatments with international experience.`,
        phone: `98765432${i.toString().padStart(2, '0')}`,
        address: `${i + 10} Health Plaza, Medical District`,
        city: 'New Delhi',
        state: 'Delhi',
        rating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
        reviewsCount: Math.floor(Math.random() * 100) + 10,
        verified: true,
        status: 'active',
        licenseNumber: `LIC-${i + 10000}`,
        hasVerifiedBadge: true,
        hasServicesBadge: Math.random() > 0.5
      });
    }

    // 3. Seed Ambulance Provider & Vehicles
    console.log('Seeding Ambulances...');
    const ambulanceProviders = [
      {
        userId: providerUser._id,
        businessName: 'Lifeline Express Services',
        phone: '9876543210',
        address: 'Central Market',
        city: 'Mumbai',
        state: 'Maharashtra',
        vehicleCount: 5,
        vehicleTypes: ['Basic', 'Oxygen', 'ICU'],
        gpsEnabled: true,
        licenseNumber: 'AMB-LNC-001',
        verified: true,
        status: 'active',
        rating: 4.8,
        reviewsCount: 150
      },
      {
        userId: providerUser._id,
        businessName: 'Red Cross Rescue',
        phone: '9876543211',
        address: 'MG Road',
        city: 'Delhi',
        state: 'Delhi',
        vehicleCount: 3,
        vehicleTypes: ['Oxygen', 'ICU'],
        gpsEnabled: true,
        licenseNumber: 'AMB-LNC-002',
        verified: true,
        status: 'active',
        rating: 4.9,
        reviewsCount: 85
      },
      {
        userId: providerUser._id,
        businessName: 'City Quick Medics',
        phone: '9876543212',
        address: 'Station Square',
        city: 'Bangalore',
        state: 'Karnataka',
        vehicleCount: 8,
        vehicleTypes: ['Basic'],
        gpsEnabled: false,
        licenseNumber: 'AMB-LNC-003',
        verified: true,
        status: 'active',
        rating: 4.6,
        reviewsCount: 210
      }
    ];

    const createdAmbProviders = await AmbulanceProvider.insertMany(ambulanceProviders);

    const vehicles = [
      {
        providerId: createdAmbProviders[0]._id,
        vehicleNumber: 'MH-01-AX-1234',
        vehicleType: 'ICU',
        driverName: 'Rahul Sharma',
        phone: '9876543210',
        available: true,
        isOnline: true,
        liveLocation: { type: 'Point', coordinates: [72.8777, 19.0760] }
      },
      {
        providerId: createdAmbProviders[0]._id,
        vehicleNumber: 'MH-01-AX-5678',
        vehicleType: 'Basic',
        driverName: 'Amit Patel',
        phone: '9876543211',
        available: true,
        isOnline: true,
        liveLocation: { type: 'Point', coordinates: [72.8780, 19.0765] }
      }
    ];
    await Ambulance.insertMany(vehicles);

    // 4. Seed Blood Banks
    console.log('Seeding Blood Banks...');
    const bloodBanks = [
      {
        userId: providerUser._id,
        businessName: 'Nirogya City Blood Bank',
        phone: '9876543212',
        address: 'Main Road, Sector 5',
        city: 'Pune',
        state: 'Maharashtra',
        inventory: { 'A+': 12, 'O+': 8, 'B+': 15, 'AB+': 5, 'A-': 3, 'O-': 6, 'B-': 2, 'AB-': 1 },
        emergencySupply: true,
        verified: true,
        status: 'active',
        licenseNumber: 'BLD-LNC-999',
        rating: 4.9,
        reviewsCount: 210
      },
      {
        userId: providerUser._id,
        businessName: 'National Blood Center',
        phone: '9876543213',
        address: 'Rajpath Marg',
        city: 'Delhi',
        state: 'Delhi',
        inventory: { 'A+': 50, 'O+': 40, 'B+': 30, 'AB+': 20, 'A-': 10, 'O-': 10, 'B-': 5, 'AB-': 5 },
        emergencySupply: true,
        verified: true,
        status: 'active',
        licenseNumber: 'BLD-LNC-888',
        rating: 4.8,
        reviewsCount: 540
      }
    ];
    await BloodBankProvider.insertMany(bloodBanks);

    // 5. Seed Lab Providers & Tests
    console.log('Seeding Labs...');
    const labs = [
      {
        userId: providerUser._id,
        businessName: 'Precision Health Labs',
        phone: '9876543213',
        address: '12th Cross, Malleshwaram',
        city: 'Bangalore',
        state: 'Karnataka',
        testCategories: ['Blood Test', 'Health Package', 'Vitamin Test', 'Hormone Test'],
        homeCollection: true,
        reportTime: '24 Hours',
        verified: true,
        status: 'active',
        licenseNumber: 'LAB-LNC-555',
        rating: 4.7,
        reviewsCount: 85
      },
      {
        userId: providerUser._id,
        businessName: 'Nirogya Diagnostics',
        phone: '9876543214',
        address: 'MG Road, South Block',
        city: 'Mumbai',
        state: 'Maharashtra',
        testCategories: ['Imaging', 'Blood Test', 'Cancer Screening'],
        homeCollection: true,
        reportTime: '12 Hours',
        verified: true,
        status: 'active',
        licenseNumber: 'LAB-LNC-666',
        rating: 4.9,
        reviewsCount: 120
      },
      {
        userId: providerUser._id,
        businessName: 'Apolo Pathlabs',
        phone: '9876543215',
        address: 'Airport Road',
        city: 'Hyderabad',
        state: 'Telangana',
        testCategories: ['Covid Test', 'Full Body Checkup'],
        homeCollection: false,
        reportTime: '36 Hours',
        verified: true,
        status: 'active',
        licenseNumber: 'LAB-LNC-777',
        rating: 4.5,
        reviewsCount: 65
      },
      {
        userId: providerUser._id,
        businessName: 'City Scan & Research',
        phone: '9876543216',
        address: 'Station Square',
        city: 'Kolkata',
        state: 'West Bengal',
        testCategories: ['MRI', 'CT Scan', 'X-Ray'],
        homeCollection: false,
        reportTime: '48 Hours',
        verified: true,
        status: 'active',
        licenseNumber: 'LAB-LNC-888',
        rating: 4.6,
        reviewsCount: 95
      }
    ];

    await LabProvider.insertMany(labs);

    const tests = [
      { testName: 'Complete Blood Count (CBC)', category: 'Blood Test', price: 299, description: 'Measures RBC, WBC, Hemoglobin, and Platelets.' },
      { testName: 'Lipid Profile', category: 'Blood Test', price: 599, description: 'Measures cholesterol and triglyceride levels.' },
      { testName: 'Thyroid Profile (T3 T4 TSH)', category: 'Hormone Test', price: 799, description: 'Comprehensive thyroid function test.' },
      { testName: 'Vitamin D Total', category: 'Vitamin Test', price: 1299, description: 'Checks for Vitamin D levels in the blood.' },
      { testName: 'Full Body Health Checkup', category: 'Health Package', price: 1999, description: 'Over 60 essential tests for complete health screening.' }
    ];
    await Lab.insertMany(tests);

    console.log('✅ Database seeded successfully with consolidated data!');
    process.exit();
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedData();
