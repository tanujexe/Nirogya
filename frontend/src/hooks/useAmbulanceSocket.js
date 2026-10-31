import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000/ambulance';

export const useAmbulanceSocket = (userId, role) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'], // Allow polling for better stability
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to ambulance socket');
      
      if (role === 'ambulance') {
        socket.emit('driver_online', { userId });
      } else {
        socket.emit('join_user', { userId });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from ambulance socket');
    });

    return () => {
      if (role === 'ambulance') {
        socket.emit('driver_offline', { userId });
      }
      socket.disconnect();
    };
  }, [userId, role]);

  const joinBookingRoom = (bookingId) => {
    if (socketRef.current) {
      socketRef.current.emit('join_booking', { bookingId });
    }
  };

  const updateLocation = (data) => {
    if (socketRef.current) {
      socketRef.current.emit('update_location', { ...data, userId });
    }
  };

  const updateTripStatus = (data) => {
    if (socketRef.current) {
      socketRef.current.emit('update_trip_status', data);
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    joinBookingRoom,
    updateLocation,
    updateTripStatus
  };
};
