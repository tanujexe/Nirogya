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

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Create a dummy user for providers if not exists
    let providerUser = await User.findOne({ email: 'provider@nirogyasathi.com' });
    if (!providerUser) {
      providerUser = await User.create({
        name: 'Nirogya Provider',
        email: 'provider@nirogyasathi.com',
        password: 'password123',
        role: 'user'
      });
    }

    // 1. Seed Doctors
    console.log('Seeding Doctors...');
    const doctors = [
      {
        userId: providerUser._id,
        specialization: 'Cardiologist',
        experience: 15,
        fees: 800,
        qualification: 'MBBS, MD (Cardiology)',
        about: 'Expert in heart-related surgeries and treatments with over 15 years of experience in top hospitals.',
        rating: 4.9,
        reviewsCount: 45,
        verified: true,
        status: 'active',
        licenseNumber: 'DOC-12345'
      },
      {
        userId: providerUser._id,
        specialization: 'Dermatologist',
        experience: 8,
        fees: 500,
        qualification: 'MBBS, DVD',
        about: 'Specialist in skin, hair and nail treatments.',
        rating: 4.7,
        reviewsCount: 28,
        verified: true,
        status: 'active',
        licenseNumber: 'DOC-67890'
      }
    ];
    await Doctor.deleteMany({ userId: providerUser._id });
    await Doctor.insertMany(doctors);

    // 2. Seed Ambulance Provider & Vehicles
    console.log('Seeding Ambulances...');
    await AmbulanceProvider.deleteMany({ userId: providerUser._id });
    const ambProvider = await AmbulanceProvider.create({
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
    });

    await Ambulance.deleteMany({ providerId: ambProvider._id });
    const vehicles = [
      {
        providerId: ambProvider._id,
        vehicleNumber: 'MH-01-AX-1234',
        vehicleType: 'ICU',
        driverName: 'Rahul Sharma',
        phone: '9876543210',
        available: true,
        isOnline: true,
        liveLocation: { type: 'Point', coordinates: [72.8777, 19.0760] }
      },
      {
        providerId: ambProvider._id,
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

    // 3. Seed Blood Banks
    console.log('Seeding Blood Banks...');
    await BloodBankProvider.deleteMany({ userId: providerUser._id });
    await BloodBankProvider.create({
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
    });

    // 4. Seed Lab Providers & Tests
    console.log('Seeding Labs...');
    await LabProvider.deleteMany({ userId: providerUser._id });
    const labP = await LabProvider.create({
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
    });

    await Lab.deleteMany({});
    const tests = [
      { testName: 'Complete Blood Count (CBC)', category: 'Blood Test', price: 299, description: 'Measures RBC, WBC, Hemoglobin, and Platelets.' },
      { testName: 'Lipid Profile', category: 'Blood Test', price: 599, description: 'Measures cholesterol and triglyceride levels.' },
      { testName: 'Thyroid Profile (T3 T4 TSH)', category: 'Hormone Test', price: 799, description: 'Comprehensive thyroid function test.' },
      { testName: 'Vitamin D Total', category: 'Vitamin Test', price: 1299, description: 'Checks for Vitamin D levels in the blood.' },
      { testName: 'Full Body Health Checkup', category: 'Health Package', price: 1999, description: 'Over 60 essential tests for complete health screening.' }
    ];
    await Lab.insertMany(tests);

    console.log('Database seeded successfully!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedData();
