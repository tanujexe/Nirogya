const Ambulance = require('../models/Ambulance');
const Booking = require('../models/Booking');

module.exports = (io) => {
  const ambulanceNS = io.of('/ambulance');

  ambulanceNS.on('connection', (socket) => {
    console.log(`🚑 Ambulance Socket connected: ${socket.id}`);

    // Driver or Provider comes online
    socket.on('driver_online', async ({ userId }) => {
      try {
        const ambulance = await Ambulance.findOneAndUpdate(
          { driverId: userId },
          { socketId: socket.id, isOnline: true, available: true },
          { returnDocument: 'after' }
        );
        if (ambulance) {
          socket.join(`driver:${userId}`);
          socket.join(`provider:${ambulance.providerId}`);
        } else {
          // Check if user is an AmbulanceProvider
          const provider = await require('../models/AmbulanceProvider').findOne({ userId });
          if (provider) {
            socket.join(`provider:${provider._id}`);
          }
        }
        // Always join the shared dispatch room
        socket.join('ambulance_dispatch');
      } catch (err) {
        console.error('driver_online error:', err.message);
      }
    });

    // User/Driver joins a specific booking room for tracking
    socket.on('join_booking', ({ bookingId }) => {
      socket.join(`booking:${bookingId}`);
    });

    // User joins their personal room
    socket.on('join_user', ({ userId }) => {
      socket.join(`user:${userId}`);
    });

    // Driver location update
    socket.on('update_location', async (data) => {
      const { userId, lat, lng, bookingId, speed, heading } = data;
      try {
        const ambulance = await Ambulance.findOneAndUpdate(
          { driverId: userId },
          {
            'liveLocation.coordinates': [parseFloat(lng), parseFloat(lat)],
            'liveLocation.updatedAt': new Date()
          },
          { returnDocument: 'after' }
        );

        if (ambulance && bookingId) {
          ambulanceNS.to(`booking:${bookingId}`).emit('location_updated', {
            lat,
            lng,
            speed,
            heading,
            timestamp: new Date()
          });
        }
      } catch (err) {
        console.error('update_location error:', err.message);
      }
    });

    // Driver updates trip status
    socket.on('update_trip_status', async (data) => {
      const { bookingId, status, location } = data;
      try {
        const booking = await Booking.findById(bookingId);
        if (booking) {
          booking.status = status;
          if (location) {
            booking.trackingHistory.push({
              status,
              location: {
                type: 'Point',
                coordinates: [location.lng, location.lat]
              }
            });
          }
          await booking.save();

          // If finished, free the ambulance
          if (['completed', 'cancelled', 'rejected'].includes(status)) {
            await Ambulance.findOneAndUpdate(
              { currentBooking: bookingId },
              { isBusy: false, currentBooking: null }
            );
          }

          // Broadcast to the booking room
          ambulanceNS.to(`booking:${bookingId}`).emit('status_changed', {
            bookingId,
            status,
            timestamp: new Date()
          });

          // Also notify the specific user
          ambulanceNS.to(`user:${booking.userId}`).emit('booking_status_update', {
            bookingId,
            status
          });
        }
      } catch (err) {
        console.error('update_trip_status error:', err.message);
      }
    });

    // Driver goes offline
    socket.on('driver_offline', async ({ userId }) => {
      try {
        await Ambulance.findOneAndUpdate(
          { driverId: userId },
          { socketId: null, isOnline: false }
        );
        socket.leave(`driver:${userId}`);
      } catch (err) {
        console.error('driver_offline error:', err.message);
      }
    });

    socket.on('disconnect', async () => {
      try {
        await Ambulance.findOneAndUpdate(
          { socketId: socket.id },
          { socketId: null, isOnline: false }
        );
      } catch (err) {
        // Ignore
      }
    });
  });
};
