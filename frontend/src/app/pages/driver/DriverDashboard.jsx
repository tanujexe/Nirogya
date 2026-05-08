import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Power, MapPin, Navigation, User as UserIcon, 
  Phone, Clock, CheckCircle2, XCircle, 
  Loader2, AlertCircle, TrendingUp, History,
  LayoutDashboard, Shield, ChevronRight,
  Zap, Heart, Activity, Wind, ArrowRight
} from 'lucide-react';
import MapContainer from '../../components/ambulance/MapContainer';
import { ambulanceAPI } from '../../utils/api';
import { useAmbulanceSocket } from '../../../hooks/useAmbulanceSocket';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';

export default function DriverDashboard() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [activeTrip, setActiveTrip] = useState(null);
  const [incomingBooking, setIncomingBooking] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eta, setEta] = useState('--');

  const { socket, updateLocation, updateTripStatus, joinBookingRoom } = useAmbulanceSocket(user?._id, 'ambulance');

  // Join booking room if active trip exists on mount
  useEffect(() => {
    if (activeTrip?._id) {
      joinBookingRoom(activeTrip._id);
    }
  }, [activeTrip?._id, joinBookingRoom]);

  // Watch Location & Broadcast
  useEffect(() => {
    let watchId;
    if (navigator.geolocation && isOnline) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCurrentLocation(loc);
          
          // Send to socket
          updateLocation({
            lat: loc.lat,
            lng: loc.lng,
            bookingId: activeTrip?._id,
            speed: pos.coords.speed,
            heading: pos.coords.heading
          });
        },
        (err) => console.error("GPS Error:", err),
        { enableHighAccuracy: true, distanceFilter: 5 }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isOnline, activeTrip, updateLocation]);

  // Listen for Booking Requests & Claims
  useEffect(() => {
    if (socket && isOnline) {
      socket.on('new_booking_request', (data) => {
        if (!activeTrip) {
          setIncomingBooking(data);
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        }
      });

      socket.on('booking_claimed', ({ bookingId }) => {
        if (incomingBooking?.bookingId === bookingId) {
          setIncomingBooking(null);
          toast.info("Mission claimed by another unit.");
        }
      });
    }
    return () => {
      if (socket) {
        socket.off('new_booking_request');
        socket.off('booking_claimed');
      }
    };
  }, [socket, isOnline, activeTrip, incomingBooking]);

  useEffect(() => {
    fetchCurrentTrip();
  }, []);

  const fetchCurrentTrip = async () => {
    try {
      const res = await ambulanceAPI.getDriverCurrentTrip();
      if (res.data?.success && res.data.data) {
        setActiveTrip(res.data.data);
        setIsOnline(true);
      }
      setLoading(false);
    } catch (err) {
      console.error("Fetch trip error:", err);
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      const res = await ambulanceAPI.respondToBooking(incomingBooking.bookingId, { action: 'accept' });
      const trip = res.data.data;
      setActiveTrip(trip);
      setIncomingBooking(null);
      joinBookingRoom(trip._id);
      toast.success("Mission Accepted. Navigation active.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not accept");
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await ambulanceAPI.updateStatus(activeTrip._id, { status: newStatus, location: currentLocation });
      updateTripStatus({ 
        bookingId: activeTrip._id, 
        status: newStatus, 
        location: currentLocation 
      });
      
      if (['completed', 'cancelled'].includes(newStatus)) {
        setActiveTrip(null);
        setRoute(null);
        toast.success("Trip completed. Standing by.");
      } else {
        setActiveTrip({ ...activeTrip, status: newStatus });
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  // Route calculation for navigation
  useEffect(() => {
    if (currentLocation && activeTrip) {
      const pickupCoords = activeTrip.pickupLocation.coordinates.coordinates;
      const destCoords = activeTrip.destination.coordinates.coordinates;

      const dest = ['accepted', 'reaching'].includes(activeTrip.status) 
        ? { lat: pickupCoords[1], lng: pickupCoords[0] }
        : { lat: destCoords[1], lng: destCoords[0] };

      const getRoute = async () => {
        try {
          const res = await axios.get(`https://router.project-osrm.org/route/v1/driving/${currentLocation.lng},${currentLocation.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`);
          if (res.data.routes.length > 0) {
            const routeData = res.data.routes[0];
            const coords = routeData.geometry.coordinates.map(c => [c[1], c[0]]);
            setRoute(coords);
            setEta(Math.round(routeData.duration / 60) + "m");
          }
        } catch (err) {
          console.error("OSRM Error:", err);
        }
      };
      getRoute();
    }
  }, [currentLocation, activeTrip]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>;

  return (
    <div className="min-h-screen pt-20 pb-8 bg-slate-50 dark:bg-slate-950 flex flex-col">
      <div className="max-w-[1600px] mx-auto w-full px-4 flex-1 flex flex-col gap-4 md:gap-6">
        
        {/* Driver Header */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-slate-200 dark:border-white/5 shadow-2xl">
           <div className="flex items-center gap-6 mb-6 md:mb-0">
              <div className="relative">
                <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
                   <LayoutDashboard className="w-10 h-10 text-white" />
                </div>
                {isOnline && <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white dark:border-slate-900 animate-pulse" />}
              </div>
              <div>
                 <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Pilot Command</h1>
                 <div className="flex items-center gap-3 text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">
                   <Shield className="w-4 h-4 text-green-500" />
                   Emergency Service ID: #AMB-{user?._id?.slice(-4)}
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-8">
              <div className="text-right hidden sm:block">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Telemetry Status</p>
                 <div className="flex items-center gap-2 justify-end">
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                    <p className={`text-sm font-black italic ${isOnline ? 'text-green-500' : 'text-slate-400'}`}>
                      {isOnline ? 'Broadcasting Location' : 'Link Offline'}
                    </p>
                 </div>
              </div>
              <button 
                onClick={() => setIsOnline(!isOnline)}
                className={`w-24 h-24 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 transition-all shadow-2xl ${isOnline ? 'bg-red-500 text-white shadow-red-500/40 hover:bg-red-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200'}`}
              >
                <Power className="w-8 h-8" />
                <span className="text-[10px] font-black uppercase">{isOnline ? 'Stop' : 'Start'}</span>
              </button>
           </div>
        </div>

        <div className="flex-1 grid lg:grid-cols-12 gap-6">
          {/* Main Tactical Map */}
          <div className="lg:col-span-8 relative min-h-[500px]">
             <div className="w-full h-full rounded-[3.5rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 bg-slate-200 dark:bg-slate-800">
               <MapContainer 
                center={currentLocation ? [currentLocation.lat, currentLocation.lng] : [28.6139, 77.2090]}
                zoom={16}
                userLocation={currentLocation}
                route={route}
                pickupLocation={activeTrip ? { 
                  lat: activeTrip.pickupLocation.coordinates.coordinates[1], 
                  lng: activeTrip.pickupLocation.coordinates.coordinates[0] 
                } : null}
                destinationLocation={activeTrip ? { 
                  lat: activeTrip.destination.coordinates.coordinates[1], 
                  lng: activeTrip.destination.coordinates.coordinates[0] 
                } : null}
               />
             </div>
             
             {/* Live Navigation HUD */}
             {activeTrip && (
               <div className="absolute top-8 left-8 right-8 z-[1000] flex justify-between items-start pointer-events-none">
                 <div className="bg-slate-900/95 backdrop-blur-2xl text-white p-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-white/10 flex items-center gap-6 pointer-events-auto">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center">
                      <Navigation className="w-8 h-8 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-1">Time to Target</p>
                      <p className="text-3xl font-black italic">{eta}</p>
                    </div>
                 </div>
                 
                 <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-4 rounded-3xl shadow-xl border border-white/20 pointer-events-auto">
                    <div className="flex items-center gap-3">
                       <Zap className="w-5 h-5 text-amber-500" />
                       <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">High Priority</span>
                    </div>
                 </div>
               </div>
             )}
          </div>

          {/* Mission Control Panel */}
          <div className="lg:col-span-4 flex flex-col gap-6">
             {activeTrip ? (
               <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border-2 border-blue-600 shadow-2xl flex flex-col gap-8 flex-1 overflow-hidden relative group">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                  
                  <div className="flex items-center justify-between relative z-10">
                     <span className="px-5 py-2 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] animate-pulse shadow-lg shadow-blue-500/20">
                        Mission Active
                     </span>
                     <div className="flex items-center gap-3 text-slate-500">
                        <Clock className="w-5 h-5" />
                        <span className="text-lg font-black italic">{eta}</span>
                     </div>
                  </div>

                  <div className="space-y-8 relative z-10">
                     <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-inner">
                           <UserIcon className="w-8 h-8 text-slate-600" />
                        </div>
                        <div className="flex-1">
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Patient Commander</p>
                           <p className="text-2xl font-black text-slate-900 dark:text-white">{activeTrip.user?.name || 'Emergency Case'}</p>
                           <a href={`tel:${activeTrip.user?.phone}`} className="text-sm font-black text-blue-600 flex items-center gap-2 mt-2 hover:translate-x-1 transition-transform">
                              <Phone className="w-4 h-4" />
                              Contact Now
                           </a>
                        </div>
                     </div>

                     <div className="h-[1px] bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />

                     <div className="space-y-6">
                        <div className="flex items-start gap-4">
                           <div className="w-3 h-3 bg-red-500 rounded-full mt-2 ring-4 ring-red-500/20" />
                           <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Pickup Zone</p>
                              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-snug">
                                {activeTrip.pickupLocation.address}
                              </p>
                           </div>
                        </div>
                        <div className="flex items-start gap-4">
                           <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 ring-4 ring-blue-500/20" />
                           <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Target Medical Facility</p>
                              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-snug">
                                {activeTrip.destination.address}
                              </p>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="mt-auto grid grid-cols-1 gap-4 relative z-10">
                     {activeTrip.status === 'accepted' && (
                       <button onClick={() => handleStatusUpdate('reaching')} className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black shadow-2xl hover:bg-blue-700 transition-all text-lg uppercase tracking-widest">
                          Start Response
                       </button>
                     )}
                     {activeTrip.status === 'reaching' && (
                       <button onClick={() => handleStatusUpdate('picked')} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black shadow-2xl hover:bg-indigo-700 transition-all text-lg uppercase tracking-widest">
                          Patient Secured
                       </button>
                     )}
                     {activeTrip.status === 'picked' && (
                       <button onClick={() => handleStatusUpdate('reached')} className="w-full py-6 bg-cyan-600 text-white rounded-[2rem] font-black shadow-2xl hover:bg-cyan-700 transition-all text-lg uppercase tracking-widest">
                          At Hospital
                       </button>
                     )}
                     {activeTrip.status === 'reached' && (
                       <button onClick={() => handleStatusUpdate('completed')} className="w-full py-6 bg-green-600 text-white rounded-[2rem] font-black shadow-2xl hover:bg-green-700 transition-all text-lg uppercase tracking-widest">
                          Finalize Mission
                       </button>
                     )}
                  </div>
               </div>
             ) : (
               <>
                 <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-200 dark:border-white/5 shadow-2xl flex flex-col gap-8">
                    <div className="flex items-center justify-between">
                       <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Duty Metrics</h3>
                       <TrendingUp className="w-6 h-6 text-green-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-white/5">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Earnings</p>
                          <p className="text-2xl font-black text-slate-900 dark:text-white">₹4.2k</p>
                       </div>
                       <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-white/5">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Trips</p>
                          <p className="text-2xl font-black text-slate-900 dark:text-white">12</p>
                       </div>
                    </div>
                 </div>

                 <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-200 dark:border-white/5 shadow-2xl flex-1 flex flex-col gap-8">
                    <div className="flex items-center justify-between">
                       <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Mission History</h3>
                       <History className="w-6 h-6 text-slate-400" />
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-10 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[2.5rem] opacity-30">
                       <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-6">
                          <CheckCircle2 className="w-8 h-8 text-slate-400" />
                       </div>
                       <p className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Telemetry Cleared</p>
                    </div>
                 </div>
               </>
             )}
          </div>
        </div>
      </div>

      {/* Emergency Request Fullscreen Overlay */}
      <AnimatePresence>
        {incomingBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-red-950/95 backdrop-blur-3xl z-[2000] flex items-center justify-center p-4"
          >
             <motion.div
               initial={{ scale: 0.9, y: 50 }}
               animate={{ scale: 1, y: 0 }}
               className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-12 relative overflow-hidden shadow-[0_0_100px_rgba(239,68,68,0.4)] border border-red-500/20"
             >
                {/* Urgent Background Animation */}
                <div className="absolute top-0 left-0 w-full h-1 bg-red-600">
                  <motion.div 
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 10, ease: "linear" }}
                    className="h-full bg-white origin-left"
                  />
                </div>

                <div className="relative z-10 text-center">
                   <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="w-24 h-24 bg-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl"
                   >
                      <AlertCircle className="w-12 h-12 text-white" />
                   </motion.div>
                   
                   <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-2 italic tracking-tighter uppercase">Mission Alert</h2>
                   <p className="text-red-600 font-black uppercase tracking-[0.3em] text-[10px] mb-8">Priority-One Medical Extraction</p>
                   
                   <div className="bg-slate-50 dark:bg-slate-800/80 p-8 rounded-[2.5rem] text-left mb-10 space-y-6 border border-slate-200 dark:border-white/10">
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Pickup Zone</p>
                         <p className="text-lg font-black text-slate-900 dark:text-white leading-tight truncate">{incomingBooking.pickup}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                         <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                            <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Distance</p>
                            <p className="text-lg font-black text-red-600">{incomingBooking.distance}</p>
                         </div>
                         <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                            <p className="text-[8px] font-black uppercase text-slate-400 mb-1">ETA</p>
                            <p className="text-lg font-black text-slate-900 dark:text-white">{incomingBooking.duration}</p>
                         </div>
                         <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                            <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Grant</p>
                            <p className="text-lg font-black text-green-600">₹{incomingBooking.fare}</p>
                         </div>
                      </div>
                   </div>

                   <div className="flex flex-col gap-4">
                      <button 
                        onClick={handleAccept}
                        className="w-full py-6 bg-red-600 text-white rounded-[2rem] font-black text-xl shadow-2xl hover:bg-red-700 active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center gap-4"
                      >
                         <span>Accept Mission</span>
                         <ArrowRight className="w-6 h-6" />
                      </button>
                      <button 
                        onClick={() => setIncomingBooking(null)}
                        className="w-full py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-[2rem] font-black text-xs hover:bg-slate-200 transition-all uppercase tracking-widest"
                      >
                         Decline Response
                      </button>
                   </div>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
