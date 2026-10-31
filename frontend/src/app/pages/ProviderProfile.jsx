import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  MapPin, 
  Phone, 
  Clock, 
  ShieldCheck, 
  Star, 
  MessageSquare,
  Ambulance,
  Droplets,
  FlaskConical,
  Stethoscope,
  ChevronRight,
  Info
} from 'lucide-react';
import { providersAPI } from '../utils/api';
import Loader from '../components/common/Loader';
import GeneralBookingForm from '../components/common/GeneralBookingForm';

export default function ProviderProfile() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await providersAPI.getById(type, id);
        setProvider(res.data.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [type, id]);

  if (loading) return <Loader />;
  if (!provider) return (
    <div className="min-h-screen pt-32 text-center">
      <h2 className="text-2xl font-bold">Provider not found</h2>
      <button onClick={() => navigate(-1)} className="mt-4 text-[var(--healthcare-cyan)]">Go Back</button>
    </div>
  );

  const getIcon = () => {
    switch (type) {
      case 'doctor': return Stethoscope;
      case 'ambulance': return Ambulance;
      case 'bloodbank': return Droplets;
      case 'lab': return FlaskConical;
      default: return Info;
    }
  };

  const Icon = getIcon();

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section / Cover */}
      <div className="relative h-64 md:h-96 bg-gradient-to-r from-slate-900 to-slate-800 overflow-hidden">
        <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1600&q=80')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Profile Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-card border border-border rounded-[40px] p-8 md:p-12 shadow-2xl">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-32 h-32 md:w-48 md:h-48 rounded-3xl bg-muted border-4 border-card shadow-xl overflow-hidden shrink-0">
                  <img 
                    src={provider.userId?.avatar || `https://ui-avatars.com/api/?name=${provider.businessName || provider.userId?.name}&background=random`} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-[var(--healthcare-cyan)]/10 text-[var(--healthcare-cyan)] rounded-full text-xs font-bold uppercase tracking-widest">
                      Verified {type}
                    </span>
                    <div className="flex items-center gap-1 text-yellow-500 font-bold">
                      <Star className="w-4 h-4 fill-current" />
                      {provider.rating || '4.8'}
                      <span className="text-muted-foreground text-xs font-normal">({provider.reviewsCount || '120'} reviews)</span>
                    </div>
                  </div>
                  
                  <h1 className="text-4xl md:text-5xl font-black mb-4">
                    {provider.businessName || provider.userId?.name}
                  </h1>
                  
                  <p className="text-lg text-muted-foreground mb-6 leading-relaxed max-w-2xl">
                    {provider.description || 'Dedicated healthcare provider committed to delivering excellence in medical services and patient care.'}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-[var(--healthcare-cyan)]" />
                      </div>
                      <span className="text-sm font-medium">{provider.address}, {provider.city}</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                        <Clock className="w-5 h-5 text-[var(--healthcare-cyan)]" />
                      </div>
                      <span className="text-sm font-medium">{provider.workingHours || '09:00 AM - 08:00 PM'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Role Specific Content */}
            <div className="bg-card border border-border rounded-[40px] p-8 md:p-12">
              <h3 className="text-2xl font-black mb-8">Service Details</h3>
              
              {type === 'doctor' && (
                <div className="grid sm:grid-cols-2 gap-8">
                  <div className="p-6 bg-muted/30 rounded-3xl border border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Specialization</p>
                    <p className="text-xl font-bold">{provider.specialization}</p>
                  </div>
                  <div className="p-6 bg-muted/30 rounded-3xl border border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Consultation Fee</p>
                    <p className="text-xl font-bold text-[var(--healthcare-cyan)]">₹{provider.fees}</p>
                  </div>
                  <div className="p-6 bg-muted/30 rounded-3xl border border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Experience</p>
                    <p className="text-xl font-bold">{provider.experience} Years</p>
                  </div>
                  <div className="p-6 bg-muted/30 rounded-3xl border border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Education</p>
                    <p className="text-xl font-bold">{provider.degree || provider.qualification}</p>
                  </div>
                </div>
              )}

              {type === 'ambulance' && (
                <div className="grid sm:grid-cols-2 gap-8">
                  <div className="p-6 bg-muted/30 rounded-3xl border border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Fleet Size</p>
                    <p className="text-xl font-bold">{provider.vehicleCount} Vehicles</p>
                  </div>
                  <div className="p-6 bg-muted/30 rounded-3xl border border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Vehicle Types</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {provider.vehicleTypes?.map(v => (
                        <span key={v} className="px-3 py-1 bg-white dark:bg-slate-800 border border-border rounded-lg text-xs font-bold uppercase">{v}</span>
                      ))}
                    </div>
                  </div>
                  <div className="p-6 bg-red-500/5 rounded-3xl border border-red-500/10">
                    <p className="text-xs font-bold text-red-500 uppercase mb-2">Emergency Status</p>
                    <p className="text-xl font-bold text-red-600">{provider.is24x7 ? 'Available 24/7' : 'Scheduled'}</p>
                  </div>
                  <div className="p-6 bg-muted/30 rounded-3xl border border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2">GPS Tracking</p>
                    <p className="text-xl font-bold">{provider.gpsEnabled ? 'Live Enabled' : 'Manual'}</p>
                  </div>
                </div>
              )}

              {type === 'bloodbank' && (
                <div className="space-y-8">
                  <p className="text-lg font-bold">Available Blood Groups</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Object.entries(provider.inventory || {}).map(([group, count]) => (
                      <div key={group} className="p-6 bg-muted/30 border border-border rounded-3xl text-center">
                        <p className="text-xl font-black text-rose-500 mb-1">{group}</p>
                        <p className={`text-sm font-bold ${count > 0 ? 'text-foreground' : 'text-muted-foreground opacity-50'}`}>
                          {count > 0 ? `${count} Units` : 'Out of Stock'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {type === 'lab' && (
                <div className="space-y-8">
                  <div className="grid sm:grid-cols-2 gap-8">
                    <div className="p-6 bg-muted/30 rounded-3xl border border-border">
                      <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Sample Collection</p>
                      <p className="text-xl font-bold">{provider.homeCollection ? 'Home Collection Available' : 'Center Visit Only'}</p>
                    </div>
                    <div className="p-6 bg-muted/30 rounded-3xl border border-border">
                      <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Report Delivery</p>
                      <p className="text-xl font-bold text-[var(--healthcare-cyan)]">{provider.reportTime}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-lg font-bold mb-4">Available Test Categories</p>
                    <div className="flex flex-wrap gap-3">
                      {provider.testCategories?.map(cat => (
                        <span key={cat} className="px-6 py-3 bg-white dark:bg-slate-800 border border-border rounded-2xl text-sm font-bold hover:border-[var(--healthcare-cyan)] transition-colors cursor-default">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Booking / Action Sidebar */}
          <div className="space-y-8">
            <div className="bg-card border border-border rounded-[40px] p-8 shadow-xl sticky top-32">
              <div className="flex items-center gap-4 mb-8">
                <div className={`w-12 h-12 rounded-2xl bg-muted flex items-center justify-center ${type === 'doctor' ? 'text-blue-500' : type === 'ambulance' ? 'text-red-500' : 'text-rose-500'}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold">Book Service</h4>
                  <p className="text-xs text-muted-foreground">Secure & Trusted</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <button 
                  onClick={() => {
                    if (type === 'doctor') {
                      navigate(`/doctor/${id}`);
                    } else {
                      setShowBooking(true);
                    }
                  }}
                  className="w-full py-4 bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] text-white rounded-2xl font-bold hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
                >
                  <span>{type === 'doctor' ? 'View Doctor Profile' : type === 'ambulance' ? 'Request Ambulance' : type === 'bloodbank' ? 'Request Blood' : 'Book Lab Test'}</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                
                <a 
                  href={`tel:${provider.phone || provider.userId?.phone}`}
                  className="w-full py-4 bg-accent hover:bg-muted rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Phone className="w-5 h-5" />
                  <span>Call Provider</span>
                </a>
              </div>

              <div className="p-6 bg-muted/30 rounded-3xl border border-border">
                <h5 className="text-xs font-bold text-muted-foreground uppercase mb-4 tracking-widest">Nirogya Safe Guarantee</h5>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-xs font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Verified Professional
                  </li>
                  <li className="flex items-center gap-2 text-xs font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure Data Privacy
                  </li>
                  <li className="flex items-center gap-2 text-xs font-medium">
                    <MessageSquare className="w-4 h-4 text-emerald-500" /> 24/7 Support Access
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showBooking && (
        <GeneralBookingForm 
          provider={provider} 
          type={type} 
          onClose={() => setShowBooking(false)} 
        />
      )}
    </div>
  );
}
