import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, Navigation, Ambulance, ShieldCheck, 
  Clock, ArrowRight, Loader2, Search, X, 
  Map as MapIcon, Info, PhoneCall, AlertCircle,
  Activity, Wind, Heart, Zap, Crosshair, ChevronUp
} from 'lucide-react';
import MapContainer from '../../components/ambulance/MapContainer';
import { ambulanceAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useAmbulanceSocket } from '../../../hooks/useAmbulanceSocket';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const AMBULANCE_TYPES = [
  { id: 'Basic', name: 'Basic Life Support', icon: Ambulance, price: 500, desc: 'Oxygen, standard stretcher, first aid.', color: 'text-blue-500' },
  { id: 'Oxygen', name: 'Oxygen Support', icon: Wind, price: 1200, desc: 'High-flow oxygen, pulse oximeter.', color: 'text-cyan-500' },
  { id: 'ICU', name: 'ICU Ambulance', icon: Activity, price: 2500, desc: 'Ventilator, defibrillator, critical care team.', color: 'text-indigo-500' },
  { id: 'Ventilator', name: 'Ventilator Support', icon: Heart, price: 3500, desc: 'Advanced ventilator for critical breathing.', color: 'text-red-500' },
];

const GWALIOR_HOSPITALS = [
  { name: 'Jaya Arogya Hospital (JAH)', address: 'Kampoo, Gwalior, MP', coords: [78.1633, 26.2084] },
  { name: 'BIMR Hospital', address: 'Surya Nagar, Gwalior, MP', coords: [78.1789, 26.1950] },
  { name: 'Apollo Spectra Hospital', address: 'Vikas Nagar, Gwalior, MP', coords: [78.1932, 26.2291] },
  { name: 'District Hospital Murar', address: 'Murar, Gwalior, MP', coords: [78.2250, 26.2200] },
];

export default function AmbulanceBooking() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [findingDrivers, setFindingDrivers] = useState(false);
  
  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);
  const [selectedType, setSelectedType] = useState('Basic');
  
  const [pickupSearch, setPickupSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');
  const [pickupResults, setPickupResults] = useState([]);
  const [destResults, setDestResults] = useState([]);
  
  const [mapCenter, setMapCenter] = useState([26.2298, 78.1734]);
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyAmbulances, setNearbyAmbulances] = useState([]);
  const [route, setRoute] = useState(null);
  const [routeInfo, setRouteInfo] = useState({ distance: '', duration: '', fare: 0 });

  const [viewState, setViewState] = useState('initial'); // initial, scanning, selection, confirmed

  // Check for pre-filled destination from navigation state
  useEffect(() => {
    if (location.state?.destination) {
      const { name, address, coordinates } = location.state.destination;
      setDestination({ address, coordinates });
      setDestSearch(name);
      setViewState('selection');
    }
  }, [location.state]);

  // Auto-Location System
  useEffect(() => {
    handleAutoLocation();
  }, []);

  const handleAutoLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const loc = { lat: latitude, lng: longitude };
          setUserLocation(loc);
          setMapCenter([latitude, longitude]);
          
          // Reverse geocode to get address
          try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const address = res.data.display_name;
            setPickup({ address, coordinates: [longitude, latitude] });
            setPickupSearch(address);
            fetchNearbyAmbulances(loc);
          } catch (err) {
            setPickup({ address: 'Current Location', coordinates: [longitude, latitude] });
          }
          setLoading(false);
        },
        () => {
          toast.error("Location permission denied. Please search manually.");
          setLoading(false);
        },
        { enableHighAccuracy: true }
      );
    }
  };

  const discoveryTimeoutRef = useRef(null);

  const fetchNearbyAmbulances = async (loc) => {
    try {
      const res = await ambulanceAPI.getNearby({ lat: loc.lat, lng: loc.lng });
      
      // Clear any existing discovery timeout
      if (discoveryTimeoutRef.current) clearTimeout(discoveryTimeoutRef.current);
      
      discoveryTimeoutRef.current = setTimeout(() => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setNearbyAmbulances(res.data.data.map((amb, idx) => ({
            position: { lat: amb.liveLocation?.coordinates[1] || 0, lng: amb.liveLocation?.coordinates[0] || 0 },
            type: 'ambulance',
            label: amb.vehicleNumber || 'Rescue Unit',
            status: amb.isBusy ? 'busy' : 'online',
            isNearest: idx === 0
          })));
        } else {
          setNearbyAmbulances([]);
        }
      }, 1000);
    } catch (err) {
      console.error("Discovery error:", err);
      setNearbyAmbulances([]);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (discoveryTimeoutRef.current) clearTimeout(discoveryTimeoutRef.current);
    };
  }, []);

  const searchLocation = async (query, type) => {
    if (query.length < 3) return;
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5`);
      if (type === 'pickup') setPickupResults(res.data);
      else setDestResults(res.data);
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  const selectLocation = (item, type) => {
    const loc = {
      address: item.display_name,
      coordinates: [parseFloat(item.lon), parseFloat(item.lat)]
    };
    if (type === 'pickup') {
      setPickup(loc);
      setPickupSearch(item.display_name);
      setPickupResults([]);
      setMapCenter([loc.coordinates[1], loc.coordinates[0]]);
      fetchNearbyAmbulances({ lat: loc.coordinates[1], lng: loc.coordinates[0] });
    } else {
      setDestination(loc);
      setDestSearch(item.display_name);
      setDestResults([]);
      setViewState('selection');
    }
  };

  // Route Calculation
  useEffect(() => {
    if (pickup && destination) {
      const getRoute = async () => {
        try {
          const res = await axios.get(`https://router.project-osrm.org/route/v1/driving/${pickup.coordinates[0]},${pickup.coordinates[1]};${destination.coordinates[0]},${destination.coordinates[1]}?overview=full&geometries=geojson`);
          if (res.data.routes.length > 0) {
            const routeData = res.data.routes[0];
            const coords = routeData.geometry.coordinates.map(c => [c[1], c[0]]);
            setRoute(coords);
            
            const distInKm = routeData.distance / 1000;
            const durationInMins = Math.round(routeData.duration / 60);
            const basePrice = AMBULANCE_TYPES.find(t => t.id === selectedType).price;
            const calculatedFare = Math.round(basePrice + (distInKm * 20));
            
            setRouteInfo({
              distance: distInKm.toFixed(1) + " km",
              duration: durationInMins + " mins",
              fare: calculatedFare
            });
          }
        } catch (err) {
          console.error("Route error:", err);
        }
      };
      getRoute();
    }
  }, [pickup, destination, selectedType]);

  const { socket, joinBookingRoom } = useAmbulanceSocket(user?._id, 'user');
  
  // Listen for real-time mission acceptance
  useEffect(() => {
    if (socket) {
      socket.on('booking_accepted', (data) => {
        toast.success("Rescue mission confirmed! Pilot is en-route.");
        // Short delay for visual transition
        setTimeout(() => {
          navigate(`/ambulance/track/${data.bookingId}`);
        }, 1500);
      });

      socket.on('booking_rejected', () => {
        setFindingDrivers(false);
        toast.error("Nearby pilots are currently engaged. Retrying dispatch...");
      });
    }
    return () => {
      if (socket) {
        socket.off('booking_accepted');
        socket.off('booking_rejected');
      }
    };
  }, [socket, navigate]);

  const handleBookAmbulance = async () => {
    if (!pickup || !destination) {
      toast.warning("Please select pickup and destination locations");
      return;
    }

    setFindingDrivers(true);
    try {
      const res = await ambulanceAPI.book({
        pickupLocation: pickup,
        destination,
        ambulanceType: selectedType,
        distance: routeInfo.distance,
        duration: routeInfo.duration,
        fare: routeInfo.fare
      });
      
      // Join the specific booking room for real-time telemetry
      joinBookingRoom(res.data.data._id);
      
      // We don't navigate yet. We wait for a driver to accept via socket.
      console.log("Booking created, waiting for driver acceptance...", res.data.data._id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Dispatch failure. Please try again.");
      setFindingDrivers(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-500 mb-4" />
        <p className="text-white font-black uppercase tracking-widest text-[10px]">Initializing Rescue Telemetry...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full relative overflow-hidden bg-slate-900">
      {/* Immersive Map Container */}
      <div className="absolute inset-0 z-0">
        <MapContainer 
          center={pickup ? [pickup.coordinates[1], pickup.coordinates[0]] : [26.2298, 78.1734]}
          zoom={15}
          markers={[
            ...(pickup ? [{ position: { lat: pickup.coordinates[1], lng: pickup.coordinates[0] }, type: 'user', label: 'Extraction Point' }] : []),
            ...nearbyAmbulances.map(amb => ({
              position: amb.position,
              type: 'ambulance',
              label: amb.label,
              status: amb.status,
              isNearest: amb.isNearest
            }))
          ]}
          route={route}
          destinationLocation={destination ? { lat: destination.coordinates[1], lng: destination.coordinates[0] } : null}
        />
      </div>

      {/* Top Header Overlay */}
      <div className="absolute top-24 left-4 right-4 z-10 pointer-events-none">
        <div className="max-w-xl mx-auto flex justify-between items-start">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-3xl border border-white/20 shadow-2xl pointer-events-auto"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20">
                <Ambulance className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Nirogya Rescue</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Gwalior Division</p>
              </div>
            </div>
          </motion.div>

          <button 
            onClick={handleAutoLocation}
            className="w-12 h-12 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-2xl border border-white/20 text-slate-900 dark:text-white pointer-events-auto active:scale-95 transition-transform"
          >
            <Crosshair className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main UI Layer (Bottom Sheet Style) */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-end">
        <div className="max-w-2xl w-full mx-auto p-4 pointer-events-auto">
          
          <AnimatePresence mode="wait">
            {viewState === 'initial' && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 shadow-[0_-20px_60px_-12px_rgba(0,0,0,0.2)] border border-slate-200 dark:border-white/5"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-1.5 h-12 bg-red-600 rounded-full" />
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight italic">Where's the Emergency?</h2>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Automatic location detected</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="relative group">
                    <MapPin className="absolute left-5 top-5 w-5 h-5 text-red-500 z-10" />
                    <input 
                      type="text" 
                      value={pickupSearch}
                      onChange={(e) => {
                        setPickupSearch(e.target.value);
                        searchLocation(e.target.value, 'pickup');
                      }}
                      placeholder="Your Current Location..." 
                      className="w-full pl-14 pr-4 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-red-500/10 outline-none transition-all"
                    />
                    {pickupResults.length > 0 && (
                      <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden z-[2000]">
                        {pickupResults.map((item, idx) => (
                          <button key={idx} onClick={() => selectLocation(item, 'pickup')} className="w-full p-4 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 border-b last:border-0 truncate">{item.display_name}</button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative group">
                    <Navigation className="absolute left-5 top-5 w-5 h-5 text-blue-500 z-10" />
                    <input 
                      type="text" 
                      value={destSearch}
                      onChange={(e) => {
                        setDestSearch(e.target.value);
                        searchLocation(e.target.value, 'dest');
                      }}
                      placeholder="Destination Hospital..." 
                      className="w-full pl-14 pr-4 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-xl shadow-blue-500/5"
                    />
                    {destResults.length > 0 && (
                      <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden z-[2000]">
                        {destResults.map((item, idx) => (
                          <button key={idx} onClick={() => selectLocation(item, 'dest')} className="w-full p-4 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 border-b last:border-0 truncate">{item.display_name}</button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {GWALIOR_HOSPITALS.map((hosp, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectLocation({ display_name: hosp.address, lon: hosp.coords[0], lat: hosp.coords[1] }, 'dest')}
                        className="whitespace-nowrap px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-blue-500 transition-all"
                      >
                        {hosp.name}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {viewState === 'selection' && (
              <motion.div
                initial={{ y: 200, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 200, opacity: 0 }}
                className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 shadow-[0_-20px_60px_-12px_rgba(0,0,0,0.2)] border border-slate-200 dark:border-white/5"
              >
                <div className="flex justify-between items-center mb-6">
                  <button onClick={() => setViewState('initial')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                    <X className="w-6 h-6 text-slate-500" />
                  </button>
                  <div className="text-center">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Choose Your Support</h2>
                  </div>
                  <div className="w-10" />
                </div>

                <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto no-scrollbar mb-8">
                  {AMBULANCE_TYPES.map((type) => (
                    <motion.div
                      key={type.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedType(type.id)}
                      className={`p-5 rounded-[2rem] cursor-pointer border-2 transition-all flex items-center gap-5 ${selectedType === type.id ? 'bg-blue-600 border-blue-600 shadow-xl shadow-blue-500/20 text-white' : 'bg-slate-50 dark:bg-slate-800/50 border-transparent hover:border-blue-500/30'}`}
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${selectedType === type.id ? 'bg-white/20' : 'bg-white dark:bg-slate-800 shadow-sm'}`}>
                        <type.icon className={`w-7 h-7 ${selectedType === type.id ? 'text-white' : type.color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-lg leading-tight">{type.name}</p>
                        <p className={`text-[10px] font-bold mt-1 ${selectedType === type.id ? 'text-blue-100' : 'text-slate-500'}`}>{type.desc}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black italic tracking-tighter">₹{type.price}</p>
                        <p className="text-[8px] font-bold uppercase opacity-60">Base Fare</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center px-4">
                    <div className="flex gap-4">
                      <div className="text-center">
                        <p className="text-[8px] font-bold uppercase text-slate-400">Distance</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{routeInfo.distance}</p>
                      </div>
                      <div className="w-px h-8 bg-slate-200 dark:bg-white/10" />
                      <div className="text-center">
                        <p className="text-[8px] font-bold uppercase text-slate-400">Duration</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{routeInfo.duration}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Estimated Total</p>
                      <p className="text-3xl font-black text-blue-600 italic">₹{routeInfo.fare}</p>
                    </div>
                  </div>

                  <button
                    disabled={findingDrivers}
                    onClick={handleBookAmbulance}
                    className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-xl flex items-center justify-center gap-4 shadow-xl hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {findingDrivers ? (
                      <>
                        <Loader2 className="w-7 h-7 animate-spin" />
                        <span>Dispatching...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirm Emergency</span>
                        <ArrowRight className="w-7 h-7" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scanner Overlay UI - Now triggers after 'Confirming' */}
          <AnimatePresence>
            {findingDrivers && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[5000] flex items-center justify-center bg-slate-950/80 backdrop-blur-md"
              >
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-slate-900 p-10 rounded-[3rem] border border-white/10 shadow-2xl text-center max-w-xs w-full mx-4"
                >
                   <div className="relative w-24 h-24 mx-auto mb-6">
                      <div className="absolute inset-0 border-4 border-cyan-500 rounded-full animate-ping opacity-20" />
                      <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full animate-pulse" />
                      <div className="relative w-24 h-24 bg-cyan-600 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/20">
                         <Search className="w-10 h-10 text-white animate-pulse" />
                      </div>
                   </div>
                   <h3 className="text-white font-black uppercase tracking-[0.3em] text-xs mb-2">Scanning Perimeter</h3>
                   <p className="text-cyan-400 text-sm font-bold italic animate-pulse">Finding nearest pilot...</p>
                   
                   <div className="mt-8 pt-6 border-t border-white/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Dispatching Support</p>
                      <p className="text-white text-xs font-bold mt-1">Connecting to Secure Network</p>
                   </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating Status Badges */}
      <div className="absolute top-48 left-6 z-10 hidden lg:block space-y-3">
         <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-4 rounded-3xl border border-white/20 shadow-xl flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tier-1 Dispatch Active</p>
         </div>
      </div>
    </div>
  );
}
