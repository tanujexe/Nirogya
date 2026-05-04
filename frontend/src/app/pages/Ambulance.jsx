import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, MapPin, Ambulance as AmbulanceIcon, Phone, Clock, ShieldCheck, Star } from 'lucide-react';
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
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-black mb-4">
              Emergency <span className="text-red-500">Ambulance</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Rapid response emergency services. Verified providers available 24/7 across your city.
            </p>
          </div>
          
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-red-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search area or provider..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-2xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
            />
          </div>
        </div>

        {loading ? (
          <Loader />
        ) : providers.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {providers.map((provider) => (
              <motion.div
                key={provider._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                className="bg-card border border-border rounded-[40px] p-8 hover:shadow-2xl hover:shadow-red-500/10 transition-all group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                    <AmbulanceIcon className="w-8 h-8" />
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500 font-bold text-sm">
                    <Star className="w-4 h-4 fill-current" />
                    {provider.rating || '4.9'}
                  </div>
                </div>

                <h3 className="text-2xl font-black mb-2 group-hover:text-red-500 transition-colors">
                  {provider.businessName}
                </h3>
                
                <div className="space-y-3 mb-8">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-500" /> {provider.city}, {provider.state}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-red-500" /> Response: 10-15 mins
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-red-500" /> 24/7 Service Available
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 mb-8">
                  {provider.vehicleTypes?.slice(0, 3).map(type => (
                    <span key={type} className="px-3 py-1 bg-muted rounded-lg text-[10px] font-bold uppercase tracking-wider">
                      {type}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Link 
                    to={`/provider/ambulance/${provider._id}`}
                    className="py-3 bg-accent hover:bg-muted rounded-xl text-center text-sm font-bold transition-all"
                  >
                    Details
                  </Link>
                  <a 
                    href={`tel:${provider.phone}`}
                    className="py-3 bg-red-500 text-white rounded-xl text-center text-sm font-bold hover:shadow-lg hover:shadow-red-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" /> Call
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-card border border-dashed border-border rounded-[40px]">
            <AmbulanceIcon className="w-20 h-20 text-muted-foreground/20 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-2">No providers found</h2>
            <p className="text-muted-foreground">Try searching in a different area or check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}
