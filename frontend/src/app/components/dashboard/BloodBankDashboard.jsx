import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { toast } from 'react-toastify';
import { 
  Droplets, 
  Settings, 
  TrendingUp, 
  ShieldCheck,
  Plus,
  Clock,
  User as UserIcon,
  Check,
  X,
  MapPin,
  Activity
} from 'lucide-react';
import { bookingsAPI, providerAPI } from "../../utils/api";
import ProviderProfileModal from "./ProviderProfileModal";

export default function BloodBankDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, profileRes] = await Promise.all([
        bookingsAPI.getAll({ type: 'blood' }),
        providerAPI.getProfile()
      ]);
      setRequests(bookingsRes.data?.data || []);
      setProfile(profileRes.data?.data);
    } catch (error) {
      console.error("Failed to fetch blood bank data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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

  const inventory = profile?.inventory || {};
  
  const stats = [
    { label: 'Total Units', value: Object.values(inventory).reduce((a, b) => (typeof b === 'number' ? a + b : a), 0), icon: Droplets, color: 'text-red-500' },
    { label: 'Pending Requests', value: requests.filter(r => r.status === 'pending').length, icon: Clock, color: 'text-orange-500' },
    { label: 'Donations Today', value: requests.filter(r => r.status === 'completed' && r.type === 'donation').length, icon: TrendingUp, color: 'text-emerald-500' },
    { label: 'Certified', value: profile?.verified ? 'Yes' : 'No', icon: ShieldCheck, color: 'text-[var(--healthcare-cyan)]' },
  ];

  if (loading && !profile) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground animate-pulse font-medium">Monitoring blood supplies...</p>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <button 
          onClick={() => setIsProfileModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-500 text-white font-bold hover:shadow-lg hover:shadow-red-500/20 transition-all"
        >
          <Plus className="w-5 h-5" />
          Update Inventory
        </button>
        <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-card border border-border font-bold hover:bg-muted transition-all">
          <Activity className="w-5 h-5" />
          Donor Management
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
        {/* Blood Requests */}
        <div className="lg:col-span-2 bg-card border border-border rounded-[40px] p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black text-red-600">Active Requests</h3>
            <button className="text-sm font-bold text-[var(--healthcare-cyan)] hover:underline">Download Report</button>
          </div>

          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="p-12 text-center border border-dashed rounded-3xl">
                <Droplets className="w-12 h-12 mx-auto mb-4 opacity-10" />
                <p className="text-muted-foreground font-medium">No active blood requests</p>
              </div>
            ) : (
              requests.map(req => (
                <div key={req._id} className="p-6 bg-muted/30 border border-border rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:bg-muted/50 transition-all">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0">
                      <span className="font-black text-red-600">{req.details?.bloodGroup || '??'}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold">{req.userId?.name || "Requestor"}</p>
                        <span className="text-[10px] px-2 py-0.5 bg-accent rounded font-bold uppercase">{req.details?.units || 1} Unit(s)</span>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-4 h-4" /> {new Date(req.date).toLocaleDateString()}
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
                        Collected
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Inventory Sidebar */}
        <div className="bg-card border border-border rounded-[40px] p-8">
          <h3 className="text-2xl font-black mb-8">Current Stock</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(inventory).map(([group, units]) => (
              <div key={group} className="p-4 bg-muted/30 rounded-2xl border border-border">
                <p className="text-xs font-black text-muted-foreground mb-1">{group}</p>
                <p className="text-2xl font-black">{units}</p>
                <div className={`h-1 w-full mt-2 rounded-full ${units < 5 ? 'bg-red-500' : 'bg-emerald-500'}`} />
              </div>
            ))}
          </div>
          <button 
            onClick={() => setIsProfileModalOpen(true)}
            className="w-full mt-8 py-4 bg-muted rounded-2xl font-bold hover:bg-card border border-border transition-all"
          >
            Edit Profile
          </button>
        </div>
      </div>

      <ProviderProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        onUpdate={(newProfile) => setProfile(newProfile)}
      />
    </div>
  );
}
