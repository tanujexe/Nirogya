import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, MapPin, Droplets, Phone, ShieldCheck, Star, AlertCircle, Info } from 'lucide-react';
import { providersAPI } from '../utils/api';
import Loader from '../components/common/Loader';
import { Link } from 'react-router-dom';

export default function BloodBank() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchBloodBanks = async () => {
      setLoading(true);
      try {
        const res = await providersAPI.getByType('bloodbank', { search: searchTerm });
        setProviders(res.data.data);
      } catch (error) {
        console.error('Error fetching blood banks', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBloodBanks();
  }, [searchTerm]);

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-black mb-4">
              Blood <span className="text-rose-500">Inventory</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Live blood stock availability. Connect with verified blood banks for emergency supplies and donations.
            </p>
          </div>
          
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-rose-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search city or blood bank..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-2xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
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
                className="bg-card border border-border rounded-[40px] p-8 hover:shadow-2xl hover:shadow-rose-500/10 transition-all group flex flex-col"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                    <Droplets className="w-8 h-8" />
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 text-yellow-500 font-bold text-sm">
                      <Star className="w-4 h-4 fill-current" />
                      {provider.rating || '4.7'}
                    </div>
                    {provider.emergencySupply && (
                      <span className="mt-2 px-2 py-0.5 bg-rose-500 text-white text-[8px] font-black uppercase rounded tracking-widest animate-pulse">Emergency</span>
                    )}
                  </div>
                </div>

                <h3 className="text-2xl font-black mb-2 group-hover:text-rose-500 transition-colors">
                  {provider.businessName}
                </h3>
                
                <div className="space-y-3 mb-8">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-rose-500" /> {provider.city}, {provider.state}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-rose-500" /> Government Certified Bank
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-8">
                  {bloodGroups.map(group => (
                    <div key={group} className={`p-2 rounded-xl border text-center transition-all ${
                      provider.inventory?.[group] > 0 
                        ? 'bg-rose-500/5 border-rose-500/20 text-rose-600' 
                        : 'bg-muted border-border text-muted-foreground opacity-30'
                    }`}>
                      <p className="text-xs font-black">{group}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-auto grid grid-cols-2 gap-4">
                  <Link 
                    to={`/provider/bloodbank/${provider._id}`}
                    className="py-3 bg-accent hover:bg-muted rounded-xl text-center text-sm font-bold transition-all"
                  >
                    Check Stock
                  </Link>
                  <a 
                    href={`tel:${provider.phone}`}
                    className="py-3 bg-rose-500 text-white rounded-xl text-center text-sm font-bold hover:shadow-lg hover:shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" /> Contact
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-card border border-dashed border-border rounded-[40px]">
            <Droplets className="w-20 h-20 text-muted-foreground/20 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-2">No blood banks found</h2>
            <p className="text-muted-foreground">Try searching in a different area or check back later.</p>
          </div>
        )}

        <div className="mt-20 p-8 bg-card border border-border rounded-[40px] flex flex-col md:flex-row items-center gap-8">
          <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center shrink-0">
            <AlertCircle className="w-10 h-10 text-rose-500" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-2xl font-black mb-2">Emergency Blood Request?</h4>
            <p className="text-muted-foreground">If you cannot find a specific blood group, please contact our emergency helpline or the nearest government hospital immediately.</p>
          </div>
          <button className="px-8 py-4 bg-rose-500 text-white rounded-2xl font-bold hover:shadow-xl transition-all">
            Emergency Help
          </button>
        </div>
      </div>
    </div>
  );
}
