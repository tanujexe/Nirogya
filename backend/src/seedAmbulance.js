require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Ambulance = require('./models/Ambulance');
const AmbulanceProvider = require('./models/AmbulanceProvider');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nirogya';

const GWALIOR_LOCS = [
  [78.1828, 26.2183], // Center
  [78.1728, 26.2283], // North West
  [78.1928, 26.2083], // South East
  [78.1628, 26.2083], // South West
  [78.2028, 26.2283], // North East
  [78.1828, 26.2483], // Far North
  [78.1528, 26.2183], // West
  [78.2128, 26.2183], // East
  [78.1828, 26.1883], // South
  [78.1928, 26.2383], // North East
];

const AMB_TYPES = ['Basic', 'Oxygen', 'ICU', 'Ventilator'];

async function seedAmbulanceMVP() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected for Ambulance Seeding');

    // 1. Create Provider
    const providerUser = await User.findOneAndUpdate(
      { email: 'rescue@nirogya.com' },
      {
        name: 'Gwalior Rescue Corp',
        password: 'password123',
        phone: '9119119111',
        role: 'ambulance',
        isVerified: true,
        status: 'active'
      },
      { upsert: true, returnDocument: 'after' }
    );

    const provider = await AmbulanceProvider.findOneAndUpdate(
      { userId: providerUser._id },
      {
        businessName: 'Gwalior Emergency Response',
        description: 'Primary emergency dispatch for Gwalior Division.',
        phone: '9119119111',
        address: 'City Center, Gwalior',
        city: 'Gwalior',
        state: 'Madhya Pradesh',
        vehicleCount: 10,
        vehicleTypes: AMB_TYPES,
        gpsEnabled: true,
        is24x7: true,
        status: 'active',
        verified: true
      },
      { upsert: true, returnDocument: 'after' }
    );

    console.log('🏢 Provider Seeded');

    // 2. Create 10 Drivers and Ambulances
    for (let i = 0; i < 10; i++) {
      const email = `pilot${i+1}@rescue.com`;
      const driverUser = await User.findOneAndUpdate(
        { email },
        {
          name: `Pilot ${String.fromCharCode(65 + i)}`,
          password: 'password123',
          phone: `900000001${i}`,
          role: 'ambulance',
          isVerified: true,
          status: 'active'
        },
        { upsert: true, returnDocument: 'after' }
      );

      await Ambulance.findOneAndUpdate(
        { vehicleNumber: `MP-07-RES-${1000 + i}` },
        {
          providerId: provider._id,
          driverId: driverUser._id,
          driverName: driverUser.name,
          phone: driverUser.phone,
          vehicleType: AMB_TYPES[i % 4],
          available: true,
          isOnline: true,
          isBusy: false,
          liveLocation: {
            type: 'Point',
            coordinates: GWALIOR_LOCS[i],
            updatedAt: new Date()
          }
        },
        { upsert: true, returnDocument: 'after' }
      );
      console.log(`🚑 Ambulance ${i+1} Seeded at ${GWALIOR_LOCS[i]}`);
    }

    console.log('✨ Ambulance MVP Seeding Complete');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding Failed:', err);
    process.exit(1);
  }
}

seedAmbulanceMVP();
