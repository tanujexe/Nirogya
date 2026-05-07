import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { toast } from 'react-toastify';
import { 
  FlaskConical, 
  Settings, 
  TrendingUp, 
  ShieldCheck,
  Plus,
  Clock,
  ClipboardList,
  Upload,
  Check,
  X,
  Eye
} from 'lucide-react';
import { bookingsAPI, providerAPI } from "../../utils/api";
import ProviderProfileModal from "./ProviderProfileModal";
import AppointmentDetailsModal from "./AppointmentDetailsModal";
import { useAuth } from "../../context/AuthContext";
import SuspensionBanner from "../common/SuspensionBanner";

export default function LabDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, profileRes] = await Promise.all([
        bookingsAPI.getAll({ type: 'lab' }),
        providerAPI.getProfile()
      ]);
      setRequests(bookingsRes.data?.data || []);
      setProfile(profileRes.data?.data);
    } catch (error) {
      console.error("Failed to fetch lab dashboard data:", error);
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

  const stats = [
    { label: 'Total Tests', value: requests.length, icon: FlaskConical, color: 'text-emerald-500' },
    { label: 'Pending', value: requests.filter(r => r.status === 'pending').length, icon: Clock, color: 'text-orange-500' },
    { label: 'Confirmed', value: requests.filter(r => r.status === 'confirmed').length, icon: TrendingUp, color: 'text-blue-500' },
    { label: 'Certified', value: profile?.verified ? 'Yes' : 'No', icon: ShieldCheck, color: 'text-[var(--healthcare-cyan)]' },
  ];

  if (loading && !profile) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground animate-pulse font-medium">Opening laboratory systems...</p>
    </div>
  );

  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <SuspensionBanner details={user?.suspensionDetails} />
      
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <button 
          onClick={() => setIsProfileModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 text-white font-bold hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
        >
          <Settings className="w-5 h-5" />
          Edit Profile
        </button>
        <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-card border border-border font-bold hover:bg-muted transition-all">
          <ClipboardList className="w-5 h-5" />
          Manage Test List
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
        {/* Recent Test Requests */}
        <div className="lg:col-span-2 bg-card border border-border rounded-[40px] p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black text-emerald-600">Active Test Requests</h3>
            <button className="text-sm font-bold text-[var(--healthcare-cyan)] hover:underline">View Queue</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="pb-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Patient</th>
                  <th className="pb-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Test Type</th>
                  <th className="pb-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                  <th className="pb-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-muted-foreground font-medium">
                      No active requests
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req._id} className="group hover:bg-muted/30 transition-colors">
                      <td className="py-4">
                        <p className="font-bold">{req.userId?.name || "Patient"}</p>
                        <p className="text-xs text-muted-foreground">{new Date(req.date).toLocaleDateString()}</p>
                      </td>
                      <td className="py-4 font-medium capitalize">{req.details?.testName || 'Laboratory Test'}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                          req.status === 'confirmed' ? 'bg-blue-500/10 text-blue-600' : 
                          req.status === 'pending' ? 'bg-orange-500/10 text-orange-600' : 
                          req.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                           <button 
                            onClick={() => setSelectedAppointment(req)}
                            className="p-2 rounded-xl bg-accent hover:bg-[var(--healthcare-cyan)] hover:text-white transition-all"
                           >
                            <Eye className="w-4 h-4" />
                           </button>
                           {req.status === 'pending' && (
                             <>
                                <button 
                                  onClick={() => handleStatusChange(req._id, 'confirmed')}
                                  className="p-2 rounded-xl bg-emerald-500 text-white hover:shadow-lg transition-all"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleStatusChange(req._id, 'cancelled')}
                                  className="p-2 rounded-xl bg-red-500 text-white hover:shadow-lg transition-all"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                             </>
                           )}
                           {req.status === 'confirmed' && (
                              <button 
                                onClick={() => handleStatusChange(req._id, 'completed')}
                                className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-[10px] font-bold uppercase"
                              >
                                Done
                              </button>
                           )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lab Profile Sidebar */}
        <div className="bg-card border border-border rounded-[40px] p-8">
          <h3 className="text-2xl font-black mb-8">Lab Profile</h3>
          
          <div className="space-y-6">
            <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl">
              <h4 className="font-bold text-emerald-700 mb-2">Service Identity</h4>
              <p className="text-2xl font-black mb-1 text-emerald-900 line-clamp-1">{profile?.businessName || 'Lab'}</p>
              <p className="text-xs text-emerald-600/70 mb-4 font-medium">Reg: {profile?.licenseNumber}</p>
              <button 
                onClick={() => setIsProfileModalOpen(true)}
                className="w-full py-3 bg-white dark:bg-slate-800 border border-emerald-500/20 rounded-xl text-xs font-bold text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all"
              >
                Update Profile
              </button>
            </div>
            
            <div className="space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Base Info</p>
              <div className="p-4 bg-muted/30 rounded-2xl">
                <p className="text-xs text-muted-foreground">City</p>
                <p className="font-bold">{profile?.city || 'Not Set'}</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-2xl">
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="font-bold line-clamp-2 text-xs">{profile?.address || 'Not Set'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AppointmentDetailsModal 
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        appointment={selectedAppointment}
      />

      <ProviderProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        onUpdate={(newProfile) => setProfile(newProfile)}
      />
    </div>
  );
}
