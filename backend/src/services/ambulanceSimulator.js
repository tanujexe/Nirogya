const Ambulance = require('../models/Ambulance');
const AmbulanceBooking = require('../models/AmbulanceBooking');

/**
 * Ambulance Simulator Service
 * Periodically moves ambulances that are in active missions
 * to simulate real-world movement for MVP testing.
 */
module.exports = (io) => {
  const ambulanceNS = io.of('/ambulance');

  setInterval(async () => {
    try {
      // Find all busy ambulances with active bookings
      const busyAmbulances = await Ambulance.find({ isBusy: true, currentBooking: { $ne: null } });

      for (const amb of busyAmbulances) {
        const booking = await AmbulanceBooking.findById(amb.currentBooking);
        if (!booking) continue;

        const target = ['accepted', 'reaching'].includes(booking.status) 
          ? booking.pickupLocation.coordinates.coordinates
          : booking.destination.coordinates.coordinates;

        const current = amb.liveLocation.coordinates;

        // Move 0.0005 degrees (~50 meters) towards target
        const deltaLng = target[0] - current[0];
        const deltaLat = target[1] - current[1];
        const dist = Math.sqrt(deltaLng * deltaLng + deltaLat * deltaLat);

        if (dist > 0.0001) {
          const step = 0.0004;
          const nextLng = current[0] + (deltaLng / dist) * step;
          const nextLat = current[1] + (deltaLat / dist) * step;

          // Update DB
          amb.liveLocation.coordinates = [nextLng, nextLat];
          amb.liveLocation.updatedAt = new Date();
          await amb.save();

          // Broadcast to booking room
          console.log(`📡 [SIMULATOR] Broadcasting location for booking ${booking._id}: ${nextLat}, ${nextLng}`);
          ambulanceNS.to(`booking:${booking._id}`).emit('location_updated', {
            lat: nextLat,
            lng: nextLng,
            speed: 45,
            heading: Math.atan2(deltaLat, deltaLng) * (180 / Math.PI),
            timestamp: new Date()
          });
        }
      }
    } catch (err) {
      console.error('❌ [SIMULATOR ERROR]:', err.message);
    }
  }, 3000); // Update every 3 seconds
};
