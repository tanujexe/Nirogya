import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { toast } from 'react-toastify';
import { 
  Ambulance, 
  MapPin, 
  Settings, 
  Bell, 
  TrendingUp, 
  ShieldCheck,
  Check,
  X,
  Phone,
  Power,
  Clock,
  User as UserIcon,
  Eye
} from 'lucide-react';
import { bookingsAPI, providerAPI } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import SuspensionBanner from "../common/SuspensionBanner";

export default function AmbulanceDashboard() {
  const [isOnline, setIsOnline] = useState(true);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, profileRes] = await Promise.all([
        bookingsAPI.getAll({ type: 'ambulance' }),
        providerAPI.getProfile()
      ]);
      setRequests(bookingsRes.data?.data || []);
      setProfile(profileRes.data?.data);
    } catch (error) {
      console.error("Failed to fetch ambulance data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await bookingsAPI.updateStatus(bookingId, newStatus);
      toast.success(`Request ${newStatus}`);
      setRequests(prev => prev.map(r => r._id === bookingId ? { ...r, status: newStatus } : r));
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const stats = [
    { label: 'Total Fleet', value: '1', icon: Ambulance, color: 'text-blue-500' },
    { label: 'Pending', value: requests.filter(r => r.status === 'pending').length, icon: Bell, color: 'text-red-500' },
    { label: 'Confirmed', value: requests.filter(r => r.status === 'confirmed').length, icon: TrendingUp, color: 'text-emerald-500' },
    { label: 'Avg Speed', value: '35km/h', icon: ShieldCheck, color: 'text-[var(--healthcare-cyan)]' },
  ];

  if (loading && !profile) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground animate-pulse font-medium">Connecting to dispatcher...</p>
    </div>
  );

  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <SuspensionBanner details={user?.suspensionDetails} />
      
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <button 
          onClick={() => setIsOnline(!isOnline)}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
            isOnline 
              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
              : 'bg-muted text-muted-foreground border border-border'
          }`}
        >
          <Power className="w-5 h-5" />
          {isOnline ? 'System Online' : 'System Offline'}
        </button>
        <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-card border border-border font-bold hover:bg-muted transition-all">
          <Settings className="w-5 h-5" />
          Fleet Management
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div 
            key={idx}
            whileHover={{ y: -5 }}
            className="bg-card border border-border rounded-3xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-muted ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
            <h3 className="text-3xl font-black mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Active Requests */}
        <div className="lg:col-span-2 bg-card border border-border rounded-[40px] p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black">Emergency Requests</h3>
            {isOnline && <span className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-xs font-bold animate-pulse">Live</span>}
          </div>

          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="p-12 text-center border border-dashed rounded-3xl">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-10" />
                <p className="text-muted-foreground font-medium">No active requests found</p>
              </div>
            ) : (
              requests.map(req => (
                <div key={req._id} className="p-6 bg-muted/30 border border-border rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:bg-muted/50 transition-all">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0">
                      <Ambulance className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold">{req.userId?.name || "Emergency Patient"}</p>
                        <span className="text-[10px] px-2 py-0.5 bg-accent rounded font-bold uppercase">{req.details?.ambulanceType || 'Basic'}</span>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> {req.details?.pickupAddress || "Location Shared in App"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] uppercase font-black px-2 py-1 rounded-lg ${
                      req.status === 'confirmed' ? 'bg-green-500/10 text-green-600' : 
                      req.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600' : 'text-muted-foreground'
                    }`}>
                      {req.status}
                    </span>
                    
                    {req.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleStatusChange(req._id, 'confirmed')}
                          className="p-4 bg-emerald-500 text-white rounded-2xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleStatusChange(req._id, 'cancelled')}
                          className="p-4 bg-accent text-muted-foreground rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    {req.status === 'confirmed' && (
                      <button 
                        onClick={() => handleStatusChange(req._id, 'completed')}
                        className="px-4 py-3 bg-[var(--healthcare-cyan)] text-white rounded-xl font-bold text-sm"
                      >
                        Arrived
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Profile Sidebar */}
        <div className="bg-card border border-border rounded-[40px] p-8">
          <h3 className="text-2xl font-black mb-8">Fleet Profile</h3>
          <div className="space-y-6">
            <div className="p-6 bg-[var(--healthcare-cyan)]/5 border border-[var(--healthcare-cyan)]/20 rounded-3xl">
              <h4 className="font-bold mb-2">Service Identity</h4>
              <p className="text-2xl font-black mb-1">{profile?.businessName || 'Unnamed Service'}</p>
              <p className="text-xs text-muted-foreground mb-4">Registration: {profile?.licenseNumber}</p>
              <button className="w-full py-3 bg-white dark:bg-slate-800 border border-border rounded-xl text-sm font-bold hover:bg-muted transition-all">
                Edit Profile
              </button>
            </div>
            
            <div className="space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Base Info</p>
              <div className="p-4 bg-muted/30 rounded-2xl">
                <p className="text-xs text-muted-foreground">City</p>
                <p className="font-bold">{profile?.city || 'Not Set'}</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-2xl">
                <p className="text-xs text-muted-foreground">Base Station</p>
                <p className="font-bold line-clamp-1">{profile?.address || 'Not Set'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

