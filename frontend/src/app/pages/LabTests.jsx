import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, FlaskConical, MapPin, ShieldCheck, Star, ChevronRight, Home, Microscope } from 'lucide-react';
import { providersAPI } from '../utils/api';
import Loader from '../components/common/Loader';
import { Link } from 'react-router-dom';

export default function LabTests() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLabs = async () => {
      setLoading(true);
      try {
        const res = await providersAPI.getByType('lab', { search: searchTerm });
        setProviders(res.data.data);
      } catch (error) {
        console.error('Error fetching labs', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLabs();
  }, [searchTerm]);

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-black mb-4">
              Diagnostic <span className="text-emerald-500">Labs</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Book health checkups and lab tests from verified diagnostic centers. Home sample collection available.
            </p>
          </div>
          
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search tests or labs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
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
                className="bg-card border border-border rounded-[40px] p-8 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all group flex flex-col"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                    <FlaskConical className="w-8 h-8" />
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500 font-bold text-sm">
                    <Star className="w-4 h-4 fill-current" />
                    {provider.rating || '4.8'}
                  </div>
                </div>

                <h3 className="text-2xl font-black mb-2 group-hover:text-emerald-500 transition-colors">
                  {provider.businessName}
                </h3>
                
                <div className="space-y-3 mb-8">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-500" /> {provider.city}, {provider.state}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> NABL & ISO Certified
                  </p>
                  {provider.homeCollection && (
                    <p className="text-sm text-emerald-600 font-bold flex items-center gap-2 bg-emerald-500/5 w-fit px-2 py-1 rounded-lg">
                      <Home className="w-4 h-4" /> Home Collection Available
                    </p>
                  )}
                </div>

                <div className="space-y-2 mb-8">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Popular Tests</p>
                  <div className="flex flex-wrap gap-2">
                    {provider.testCategories?.slice(0, 3).map(cat => (
                      <span key={cat} className="px-3 py-1 bg-white border border-border rounded-lg text-[10px] font-bold uppercase">{cat}</span>
                    ))}
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-border flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Reports within</p>
                    <p className="font-bold text-emerald-600">{provider.reportTime || '24-48 Hours'}</p>
                  </div>
                  <Link 
                    to={`/provider/lab/${provider._id}`}
                    className="p-4 bg-emerald-500 text-white rounded-2xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all group/btn"
                  >
                    <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-card border border-dashed border-border rounded-[40px]">
            <Microscope className="w-20 h-20 text-muted-foreground/20 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-2">No labs found</h2>
            <p className="text-muted-foreground">Try searching for a different test or area.</p>
          </div>
        )}
      </div>
    </div>
  );
}