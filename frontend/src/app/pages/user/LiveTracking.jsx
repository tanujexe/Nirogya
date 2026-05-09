import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, Clock, MapPin, Ambulance, 
  ShieldCheck, Loader2, Navigation, 
  User as UserIcon, Star, CheckCircle2,
  PhoneCall, MessageSquare, AlertTriangle,
  Zap, Heart, Activity, XCircle, ChevronRight,
  ShieldAlert
} from 'lucide-react';
import MapContainer from '../../components/ambulance/MapContainer';
import { ambulanceAPI } from '../../utils/api';
import { useAmbulanceSocket } from '../../../hooks/useAmbulanceSocket';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';

export default function LiveTracking() {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState(null);
  const [route, setRoute] = useState(null);
  const [status, setStatus] = useState('pending');
  const [eta, setEta] = useState('-- mins');

  const { socket, joinBookingRoom } = useAmbulanceSocket(user?._id, 'user');

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  useEffect(() => {
    if (socket && bookingId) {
      joinBookingRoom(bookingId);

      socket.on('location_updated', (data) => {
        console.log('📍 Live Telemetry Received:', data);
        setDriverLocation({ lat: data.lat, lng: data.lng });
      });

      socket.on('status_changed', ({ status: newStatus }) => {
        setStatus(newStatus);
        fetchBookingDetails();
        
        if (newStatus === 'completed') {
          toast.success("Ambulance reached hospital. Trip completed.");
        } else if (newStatus === 'picked') {
          toast.info("Patient picked up. Heading to hospital.");
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('location_updated');
        socket.off('status_changed');
      }
    };
  }, [socket, bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const res = await ambulanceAPI.getBooking(bookingId);
      setBooking(res.data.data);
      setStatus(res.data.data.status);
      if (res.data.data.ambulance?.liveLocation) {
        setDriverLocation({
          lat: res.data.data.ambulance.liveLocation.coordinates[1],
          lng: res.data.data.ambulance.liveLocation.coordinates[0]
        });
      }
      setLoading(false);
    } catch (err) {
      toast.error("Could not fetch trip details");
      navigate('/ambulance');
    }
  };

  useEffect(() => {
    if (driverLocation && booking) {
      const pickupCoords = booking.pickupLocation.coordinates.coordinates;
      const destCoords = booking.destination.coordinates.coordinates;

      const dest = ['assigned', 'reaching', 'accepted'].includes(status) 
        ? { lat: pickupCoords[1], lng: pickupCoords[0] }
        : { lat: destCoords[1], lng: destCoords[0] };

      const getLiveRoute = async () => {
        try {
          const res = await axios.get(`https://router.project-osrm.org/route/v1/driving/${driverLocation.lng},${driverLocation.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`);
          if (res.data.routes.length > 0) {
            const routeData = res.data.routes[0];
            const coords = routeData.geometry.coordinates.map(c => [c[1], c[0]]);
            setRoute(coords);
            setEta(Math.round(routeData.duration / 60) + " mins");
          }
        } catch (err) {
          console.error("Live route error:", err);
        }
      };
      getLiveRoute();
    }
  }, [driverLocation, booking, status]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <Loader2 className="w-16 h-16 animate-spin text-cyan-500 mb-6" />
        <p className="text-white font-black uppercase tracking-[0.4em] text-[10px]">Establishing Secure Telemetry...</p>
      </div>
    );
  }

  const steps = [
    { id: 'accepted', label: 'Assigned', icon: CheckCircle2 },
    { id: 'reaching', label: 'Reaching', icon: MapPin },
    { id: 'picked', label: 'Secured', icon: Ambulance },
    { id: 'reached', label: 'At Target', icon: Navigation },
    { id: 'completed', label: 'Done', icon: Star },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === status);

  return (
    <div className="h-screen w-full relative overflow-hidden bg-slate-900">
      {/* Fullscreen Map Background */}
      <div className="absolute inset-0 z-0">
        <MapContainer 
          center={driverLocation ? [driverLocation.lat, driverLocation.lng] : [26.2298, 78.1734]}
          zoom={16}
          markers={[
            ...(driverLocation ? [{ position: driverLocation, type: 'ambulance', label: 'Rescue Unit', status: status }] : []),
            ...(booking ? [{ 
              position: { 
                lat: booking.pickupLocation.coordinates.coordinates[1], 
                lng: booking.pickupLocation.coordinates.coordinates[0] 
              }, 
              type: 'user', 
              label: 'Patient Location' 
            }] : []),
          ]}
          destinationLocation={booking ? { 
            lat: booking.destination.coordinates.coordinates[1], 
            lng: booking.destination.coordinates.coordinates[0] 
          } : null}
        />
      </div>

      {/* Cinematic Top Overlays */}
      <div className="absolute top-24 left-4 right-4 z-10 pointer-events-none">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4 justify-between items-start">
          
          {/* Mission Progress Card */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl pointer-events-auto w-full md:w-auto"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/20 relative">
                <Clock className="w-8 h-8 text-white" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-slate-900 rounded-full animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Time to Target</p>
                <p className="text-3xl font-black text-white italic tracking-tighter">{eta}</p>
              </div>
              <div className="ml-6 pl-6 border-l border-white/10 hidden sm:block">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Live Status</p>
                <p className="text-xs font-black text-cyan-400 uppercase tracking-widest italic">{status.replace('_', ' ')}</p>
              </div>
            </div>

            {/* Mobile Progress Bar */}
            <div className="mt-6 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex items-center gap-1.5 shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${idx <= currentStepIndex ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'bg-slate-800 text-slate-500'}`}>
                    <step.icon className={`w-4 h-4 ${idx === currentStepIndex ? 'animate-pulse' : ''}`} />
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`w-4 h-0.5 rounded-full ${idx < currentStepIndex ? 'bg-cyan-500' : 'bg-slate-800'}`} />
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-3xl border border-white/20 shadow-xl pointer-events-auto hidden lg:block"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500">
                <Zap className="w-5 h-5 animate-bounce" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Secure Live Link Active</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Dispatch HUD */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none p-4">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-8 md:p-10 rounded-[3.5rem] shadow-[0_-20px_60px_-12px_rgba(0,0,0,0.3)] pointer-events-auto"
          >
            <div className="flex flex-col md:flex-row items-center gap-10">
              {/* Pilot Info */}
              <div className="flex items-center gap-6 flex-1">
                <div className="relative group">
                  <div className="absolute inset-0 bg-blue-600 rounded-[2.5rem] blur-2xl opacity-20" />
                  <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-4 border-blue-500/10 relative z-10 shadow-2xl">
                    <img 
                      src={`https://ui-avatars.com/api/?name=${booking?.ambulance?.driverName || 'Driver'}&background=2563eb&color=fff&size=200`} 
                      alt="Pilot" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                      {booking?.ambulance?.driverName || 'Hero Pilot'}
                    </h3>
                    <span className="px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-green-500/10">Verified</span>
                  </div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                    <Ambulance className="w-4 h-4 text-blue-600" />
                    {booking?.ambulance?.vehicleNumber || '---'} • {booking?.ambulanceType} Support
                  </p>
                  <div className="flex gap-4 mt-3">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="text-[10px] font-black">4.9</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase">Insured</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 w-full md:w-auto">
                <a 
                  href={`tel:${booking?.ambulance?.phone}`}
                  className="w-16 h-16 bg-green-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20 hover:scale-105 active:scale-95 transition-all"
                >
                  <Phone className="w-7 h-7" />
                </a>
                <button className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all">
                  <MessageSquare className="w-7 h-7" />
                </button>
                <button className="flex-1 md:flex-none md:px-10 h-16 bg-red-600 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-3 shadow-xl hover:bg-red-700 active:scale-95 transition-all uppercase tracking-widest">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                  SOS EMERGENCY
                </button>
              </div>
            </div>

            {/* Trip Details Bar */}
            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5 grid grid-cols-2 md:grid-cols-4 gap-6">
               <div>
                 <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">From</p>
                 <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">{booking?.pickupLocation?.address}</p>
               </div>
               <div>
                 <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">To</p>
                 <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">{booking?.destination?.address}</p>
               </div>
               <div>
                 <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Grant</p>
                 <p className="text-sm font-black text-blue-600 italic">₹{booking?.fare}</p>
               </div>
               <div className="text-right">
                  <button 
                    onClick={() => navigate('/ambulance')}
                    className="text-[10px] font-black uppercase text-slate-400 hover:text-red-500 transition-colors"
                  >
                    Cancel Mission
                  </button>
               </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
