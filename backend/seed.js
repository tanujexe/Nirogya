const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Doctor = require('./models/Doctor');
const { LabTest } = require('./models/LabTest');
const User = require('./models/User');
const Booking = require('./models/Booking');

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

// Sample Users Data
const usersData = [
  {
    name: 'Admin User',
    email: 'admin@nirogya.com',
    password: 'password123',
    role: 'admin',
    phone: '9999999999',
  },
  {
    name: 'Tanuj Kumar',
    email: 'tanuj@example.com',
    password: 'password123',
    role: 'user',
    phone: '8888888888',
    age: 25,
    gender: 'Male',
  },
];

// Sample Doctors Data
const doctorsData = [
  {
    name: 'Dr. Rajesh Kumar',
    email: 'rajesh.kumar@hospital.com',
    password: 'password123',
    phone: '9876543210',
    specialization: 'Cardiologist',
    qualification: 'MBBS, MD (Cardiology)',
    experience: 15,
    fees: 800,
    rating: 4.8,
    totalReviews: 245,
    profileImage: 'https://via.placeholder.com/200',
    about: 'Experienced cardiologist specializing in heart disease prevention and treatment with over 15 years of practice.',
    availability: {
      monday: { available: true, slots: ['09:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM', '02:00 PM - 03:00 PM', '03:00 PM - 04:00 PM'] },
      tuesday: { available: true, slots: ['09:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '02:00 PM - 03:00 PM', '03:00 PM - 04:00 PM'] },
      wednesday: { available: true, slots: ['09:00 AM - 10:00 AM', '11:00 AM - 12:00 PM', '02:00 PM - 03:00 PM', '04:00 PM - 05:00 PM'] },
      thursday: { available: true, slots: ['09:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM', '03:00 PM - 04:00 PM'] },
      friday: { available: true, slots: ['09:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '02:00 PM - 03:00 PM', '03:00 PM - 04:00 PM'] },
      saturday: { available: true, slots: ['09:00 AM - 10:00 AM', '10:00 AM - 11:00 AM'] },
      sunday: { available: false, slots: [] },
    },
    hospital: {
      name: 'Apollo Hospital',
      address: '123 Main Street, Downtown',
      city: 'Mumbai',
    },
  },
  {
    name: 'Dr. Priya Sharma',
    email: 'priya.sharma@hospital.com',
    password: 'password123',
    phone: '9876543211',
    specialization: 'Pediatrician',
    qualification: 'MBBS, MD (Pediatrics)',
    experience: 12,
    fees: 600,
    rating: 4.9,
    totalReviews: 312,
    profileImage: 'https://via.placeholder.com/200',
    about: 'Dedicated pediatrician with expertise in child healthcare and development. Passionate about preventive care.',
    availability: {
      monday: { available: true, slots: ['09:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM', '04:00 PM - 05:00 PM'] },
      tuesday: { available: true, slots: ['09:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '02:00 PM - 03:00 PM', '03:00 PM - 04:00 PM'] },
      wednesday: { available: true, slots: ['09:00 AM - 10:00 AM', '11:00 AM - 12:00 PM', '02:00 PM - 03:00 PM'] },
      thursday: { available: true, slots: ['09:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '03:00 PM - 04:00 PM', '04:00 PM - 05:00 PM'] },
      friday: { available: true, slots: ['09:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM'] },
      saturday: { available: false, slots: [] },
      sunday: { available: false, slots: [] },
    },
    hospital: {
      name: 'Max Healthcare',
      address: '456 Park Avenue',
      city: 'Delhi',
    },
  },
];

// Seed function
const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('🗑️  Clearing existing data...');
    await Doctor.deleteMany({});
    await LabTest.deleteMany({});
    await User.deleteMany({});
    await Booking.deleteMany({});

    console.log('📝 Inserting users...');
    const users = await User.insertMany(usersData);
    console.log(`✅ ${users.length} users inserted`);

    console.log('📝 Inserting doctors...');
    const doctors = await Doctor.insertMany(doctorsData);
    console.log(`✅ ${doctors.length} doctors inserted`);

    // Create a sample booking
    if (users.length > 1 && doctors.length > 0) {
      console.log('📝 Inserting sample booking...');
      await Booking.create({
        user: users[1]._id,
        doctor: doctors[0]._id,
        appointmentDate: new Date(new Date().setDate(new Date().getDate() + 2)),
        timeSlot: '10:00 AM - 11:00 AM',
        reason: 'Regular checkup',
        amount: doctors[0].fees,
        status: 'Pending',
      });
      console.log('✅ Sample booking inserted');
    }

    console.log('🎉 Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeder
seedDatabase();