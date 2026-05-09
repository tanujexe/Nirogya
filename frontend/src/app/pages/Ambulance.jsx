import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, MapPin, Ambulance as AmbulanceIcon, Phone, Clock, ShieldCheck, Star, ArrowRight, Loader2 } from 'lucide-react';
import { providersAPI } from '../utils/api';
import Loader from '../components/common/Loader';
import { Link } from 'react-router-dom';

export default function Ambulance() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAmbulances = async () => {
      setLoading(true);
      try {
        const res = await providersAPI.getByType('ambulance', { search: searchTerm });
        setProviders(res.data.data);
      } catch (error) {
        console.error('Error fetching ambulances', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAmbulances();
  }, [searchTerm]);

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto">
        
        {/* Main Hero CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 bg-gradient-to-br from-red-600 to-red-800 rounded-[3rem] p-8 md:p-16 text-white shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-110 transition-transform duration-1000" />
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 rounded-full text-xs font-black uppercase tracking-widest mb-8 border border-white/20">
               <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
               Live Dispatch Active
            </div>
            <h1 className="text-4xl md:text-7xl font-black mb-6 italic tracking-tighter leading-none">
               EMERGENCY? <br/>
               BOOK LIVE NOW.
            </h1>
            <p className="text-lg md:text-xl font-bold text-red-50/80 mb-10">
               Connect with the nearest Gwalior ambulance in under 30 seconds. Real-time GPS tracking and instant dispatch.
            </p>
            <Link 
              to="/ambulance"
              className="inline-flex items-center gap-3 px-10 py-5 bg-white text-red-600 rounded-2xl font-black text-lg shadow-2xl hover:scale-105 active:scale-95 transition-all"
            >
               <span>LAUNCH BOOKING HUB</span>
               <ArrowRight className="w-6 h-6" />
            </Link>
          </div>
          <div className="absolute bottom-0 right-0 hidden lg:block opacity-20 pointer-events-none translate-x-1/4 translate-y-1/4">
             <AmbulanceIcon className="w-[600px] h-[600px]" />
          </div>
        </motion.div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter">
              Verified <span className="text-red-600">Ambulance</span> Fleet
            </h2>
            <p className="text-lg text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">
              Browse professional rescue partners in Gwalior
            </p>
          </div>
          
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-500 transition-colors" />
            <input 
              type="text"
              placeholder="Filter by area..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2rem] font-bold outline-none shadow-xl focus:ring-4 focus:ring-red-500/10 transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-32"><Loader2 className="w-12 h-12 animate-spin text-red-500" /></div>
        ) : providers.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {providers.map((provider) => (
              <motion.div
                key={provider._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -10 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 hover:shadow-2xl hover:shadow-red-500/10 transition-all group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                    <AmbulanceIcon className="w-8 h-8" />
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-black text-sm">
                    <Star className="w-4 h-4 text-amber-500 fill-current" />
                    {provider.rating || '4.9'}
                  </div>
                </div>

                <h3 className="text-2xl font-black mb-2 text-slate-900 dark:text-white group-hover:text-red-600 transition-colors tracking-tight">
                  {provider.businessName}
                </h3>
                
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-sm text-slate-500 font-bold">
                    <MapPin className="w-4 h-4 text-red-500" /> {provider.city}, {provider.state}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-500 font-bold">
                    <Clock className="w-4 h-4 text-red-500" /> Response: 10-15 mins
                  </div>
                  <div className="flex items-center gap-3 text-sm text-green-500 font-black uppercase tracking-widest text-[10px]">
                    <ShieldCheck className="w-4 h-4" /> Verified Emergency Partner
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-8">
                  {provider.vehicleTypes?.slice(0, 3).map(type => (
                    <span key={type} className="px-4 py-1.5 bg-slate-100 dark:bg-white/5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">
                      {type}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Link 
                    to={`/provider/ambulance/${provider._id}`}
                    className="py-4 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 rounded-2xl text-center text-xs font-black uppercase tracking-widest text-slate-500 transition-all border border-slate-100 dark:border-white/5"
                  >
                    Details
                  </Link>
                  <a 
                    href={`tel:${provider.phone}`}
                    className="py-4 bg-red-600 text-white rounded-2xl text-center text-xs font-black uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" /> Call Partner
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-white/10 rounded-[3rem]">
            <AmbulanceIcon className="w-20 h-20 text-slate-200 mx-auto mb-6" />
            <h2 className="text-2xl font-black mb-2 italic">Unit Discovery Failed</h2>
            <p className="text-slate-500 font-medium">Try searching in a different sector or use the Live Booking hub.</p>
          </div>
        )}
      </div>
    </div>
  );
}
