import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { MapPin, Star, Phone, Bed, AlertCircle, Navigation, Clock, Loader2, Ambulance } from "lucide-react";
import { hospitalsAPI } from "../utils/api";
import MapContainer from "../components/ambulance/MapContainer";

const GWALIOR_HOSPITALS = [
  { _id: 'h1', name: 'Jaya Arogya Hospital (JAH)', address: 'Kampoo, Gwalior, MP', beds: 850, rating: 4.5, type: 'Government Multi-Specialty', emergencyAvailable: true, coordinates: { coordinates: [78.1633, 26.2084] }, image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80" },
  { _id: 'h2', name: 'BIMR Hospital', address: 'Surya Nagar, Gwalior, MP', beds: 200, rating: 4.2, type: 'Private Multi-Specialty', emergencyAvailable: true, coordinates: { coordinates: [78.1789, 26.1950] }, image: "https://images.unsplash.com/photo-1586773860418-d3b978501217?w=800&q=80" },
  { _id: 'h3', name: 'Apollo Spectra Hospital', address: 'Vikas Nagar, Gwalior, MP', beds: 100, rating: 4.8, type: 'Private Super Specialty', emergencyAvailable: true, coordinates: { coordinates: [78.1932, 26.2291] }, image: "https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=800&q=80" },
  { _id: 'h4', name: 'District Hospital Murar', address: 'Murar, Gwalior, MP', beds: 150, rating: 3.9, type: 'Public Hospital', emergencyAvailable: true, coordinates: { coordinates: [78.2250, 26.2200] }, image: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800&q=80" },
  { _id: 'h5', name: 'Cancer Hospital', address: 'Hill Road, Gwalior, MP', beds: 300, rating: 4.4, type: 'Specialized Institute', emergencyAvailable: true, coordinates: { coordinates: [78.1580, 26.2150] }, image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&q=80" },
  { _id: 'h6', name: 'Sahara Hospital', address: 'Gwalior, MP', beds: 120, rating: 4.1, type: 'Private Multi-Specialty', emergencyAvailable: true, coordinates: { coordinates: [78.1970, 26.2223] }, image: "https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=800&q=80" },
  { _id: 'h7', name: 'Kalyan Memorial Hospital', address: 'Gwalior, MP', beds: 80, rating: 4.0, type: 'Multi-Specialty', emergencyAvailable: true, coordinates: { coordinates: [78.1888, 26.2166] }, image: "https://images.unsplash.com/photo-1551076805-e1869033e561?w=800&q=80" },
  { _id: 'h8', name: 'Lotus Hospital', address: 'City Centre, Gwalior, MP', beds: 60, rating: 4.3, type: 'Private Hospital', emergencyAvailable: true, coordinates: { coordinates: [78.2010, 26.2180] }, image: "https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?w=800&q=80" },
];

export default function Hospitals() {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Exclusively use Gwalior hospitals as requested
    setHospitals(GWALIOR_HOSPITALS);
    setLoading(false);
  }, []);

  const handleGetDirections = (hospital) => {
    const [lng, lat] = hospital.coordinates.coordinates;
    // Using search query with coordinates ensures the name is displayed and location is 'fed' correctly
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(mapUrl, '_blank');
  };

  const mapMarkers = hospitals.map(h => ({
    position: { 
      lat: h.coordinates?.coordinates?.[1] || 26.2298, 
      lng: h.coordinates?.coordinates?.[0] || 78.1734 
    },
    label: h.name,
    type: 'hospital'
  }));

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-black mb-4 italic tracking-tighter">
            Nearby{" "}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              Medical Centers
            </span>
          </h1>
          <p className="text-lg text-slate-500 font-bold uppercase tracking-widest text-xs">
            Locate the best hospitals and medical facilities in Gwalior & Beyond
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8 mb-12">
          <div className="lg:col-span-8">
            <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/20 rounded-[2rem] p-8 mb-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <div className="flex items-center space-x-4 mb-4 relative z-10">
                <div className="p-3 bg-red-500 rounded-2xl shadow-lg shadow-red-500/30">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white italic">Emergency Hotline</h2>
              </div>
              <p className="text-5xl font-black text-red-600 mb-2 relative z-10">
                108
              </p>
              <p className="text-slate-500 font-bold relative z-10">
                For immediate medical emergencies, dispatch a rescue team now.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-4 mb-8 h-[400px] shadow-xl relative overflow-hidden">
               <MapContainer 
                center={[26.2298, 78.1734]} // Gwalior
                zoom={13}
                markers={mapMarkers}
               />
            </div>

            <div>
              <div className="flex items-center justify-between mb-8 px-4">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white italic">Hospitals in Gwalior</h2>
                <span className="px-4 py-1 bg-slate-100 dark:bg-white/5 text-slate-500 rounded-full text-xs font-black uppercase tracking-widest">
                  {hospitals.length} Units Found
                </span>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                </div>
              ) : (
                <div className="space-y-6">
                  {hospitals.map((hospital, index) => (
                    <motion.div
                      key={hospital._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-6 hover:shadow-2xl hover:shadow-blue-500/10 transition-all group"
                    >
                      <div className="flex flex-col md:flex-row gap-8">
                        <div className="relative shrink-0">
                          <img
                            src={hospital.image || "https://images.unsplash.com/photo-1587350859728-117622bc937e?w=800&q=80"}
                            alt={hospital.name}
                            className="w-full md:w-56 h-56 object-cover rounded-[2rem] shadow-lg group-hover:scale-105 transition-transform duration-500"
                          />
                          {hospital.emergencyAvailable && (
                            <div className="absolute top-4 right-4 px-3 py-1 bg-red-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                              24/7 ER
                            </div>
                          )}
                        </div>

                        <div className="flex-1 flex flex-col justify-center">
                          <div className="mb-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-1 block">
                              {hospital.type || "Medical Facility"}
                            </span>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                              {hospital.name}
                            </h3>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="flex items-center space-x-2 text-sm text-slate-500 font-bold">
                              <MapPin className="w-4 h-4 text-red-500" />
                              <span className="truncate">{hospital.address}</span>
                            </div>

                            <div className="flex items-center space-x-4 text-sm">
                              <div className="flex items-center space-x-1.5 text-slate-500 font-bold">
                                <Bed className="w-4 h-4 text-blue-500" />
                                <span>{hospital.beds || "---"} beds</span>
                              </div>
                              <div className="flex items-center space-x-1.5 text-slate-900 dark:text-white font-black">
                                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                <span>{hospital.rating || "5.0"}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-4 mt-auto">
                            <button 
                              onClick={() => navigate('/ambulance', { 
                                state: { 
                                  destination: { 
                                    name: hospital.name, 
                                    address: hospital.address, 
                                    coordinates: hospital.coordinates.coordinates 
                                  } 
                                } 
                              })}
                              className="flex items-center space-x-3 px-8 py-4 rounded-2xl bg-red-600 text-white font-black text-sm shadow-xl shadow-red-500/20 hover:bg-red-700 active:scale-95 transition-all"
                            >
                              <Ambulance className="w-4 h-4" />
                              <span>BOOK RESCUE</span>
                            </button>

                            <button 
                              onClick={() => handleGetDirections(hospital)}
                              className="flex items-center space-x-3 px-8 py-4 rounded-2xl bg-blue-600 text-white font-black text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all"
                            >
                              <Navigation className="w-4 h-4" />
                              <span>GET DIRECTIONS</span>
                            </button>

                            <button className="flex items-center space-x-3 px-8 py-4 rounded-2xl border-2 border-slate-100 dark:border-white/5 text-slate-500 font-black text-sm hover:bg-slate-50 active:scale-95 transition-all">
                              <Phone className="w-4 h-4" />
                              <span>CALL</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 shadow-xl">
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 italic">Filters</h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">
                    Facility Type
                  </label>
                  <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                    <option>All Healthcare Units</option>
                    <option>Multi-Specialty</option>
                    <option>Super Specialty</option>
                    <option>Public/Government</option>
                  </select>
                </div>

                <label className="flex items-center space-x-3 cursor-pointer group p-2">
                  <input type="checkbox" className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm font-black text-slate-500 group-hover:text-blue-600 transition-colors uppercase tracking-widest">24/7 Emergency only</span>
                </label>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
              <h3 className="text-2xl font-black mb-3 italic">Expert Assistance</h3>
              <p className="text-sm font-bold opacity-80 mb-6">
                Our medical coordinators are available 24/7 to help you locate critical care beds.
              </p>
              <button className="w-full py-5 bg-white text-blue-600 rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-blue-900/20">
                TALK TO EXPERT
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 shadow-xl">
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 italic">Emergency Tips</h3>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-500/10 p-3 rounded-2xl shrink-0">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-xs font-bold text-slate-500 leading-relaxed">
                    Always confirm visiting hours and policy before heading to the facility.
                  </p>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-blue-500/10 p-3 rounded-2xl shrink-0">
                    <Phone className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-xs font-bold text-slate-500 leading-relaxed">
                    Contact the ER desk in advance to verify real-time bed occupancy.
                  </p>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-red-500/10 p-3 rounded-2xl shrink-0">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <p className="text-xs font-bold text-slate-500 leading-relaxed">
                    For life-threatening situations, dial 108 for immediate rescue.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}