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
  Eye,
  RefreshCw
} from 'lucide-react';
import { bookingsAPI, providerAPI } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { useAmbulanceSocket } from "../../hooks/useAmbulanceSocket";
import SuspensionBanner from "../common/SuspensionBanner";
import AppointmentDetailsModal from "./AppointmentDetailsModal";

export default function AmbulanceDashboard() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [requests, setRequests] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState(null);

  // Connect to ambulance dispatch socket room
  const { socket } = useAmbulanceSocket(user?._id, 'ambulance');
  
  const fetchDashboardData = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else if (!profile) setLoading(true);

      const [bookingsRes, profileRes] = await Promise.all([
        bookingsAPI.getAll({ type: 'ambulance' }),
        providerAPI.getProfile().catch(() => ({ data: { data: null } }))
      ]);

      const fetchedRequests = bookingsRes.data?.data || [];
      setRequests(fetchedRequests);
      if (profileRes.data?.data) {
        setProfile(profileRes.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch ambulance data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load + periodic polling every 10s to ensure real-time synchronization
  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Real-time socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewEmergency = (data) => {
      console.log('🚨 New emergency booking event received:', data);
      toast.info(`🚨 New Emergency: ${data.ambulanceType || 'Ambulance'} requested!`, {
        autoClose: 6000
      });
      fetchDashboardData();
    };

    const handleStatusChanged = (data) => {
      console.log('Ambulance status change event:', data);
      fetchDashboardData();
    };

    socket.on('new_booking_request', handleNewEmergency);
    socket.on('new_emergency_booking', handleNewEmergency);
    socket.on('status_changed', handleStatusChanged);
    socket.on('booking_status_update', handleStatusChanged);

    return () => {
      socket.off('new_booking_request', handleNewEmergency);
      socket.off('new_emergency_booking', handleNewEmergency);
      socket.off('status_changed', handleStatusChanged);
      socket.off('booking_status_update', handleStatusChanged);
    };
  }, [socket]);

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await bookingsAPI.updateStatus(bookingId, newStatus);
      toast.success(`Request marked as ${newStatus}`);
      setRequests(prev => prev.map(r => r._id === bookingId ? { ...r, status: newStatus } : r));
      if (selectedAppointment?._id === bookingId) {
        setSelectedAppointment(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const totalFleet = profile?.vehicleCount || 10;
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const confirmedCount = requests.filter(r => r.status === 'confirmed').length;

  const stats = [
    { label: 'Total Fleet', value: totalFleet, icon: Ambulance, color: 'text-blue-500' },
    { label: 'Pending Requests', value: pendingCount, icon: Bell, color: pendingCount > 0 ? 'text-red-500' : 'text-muted-foreground' },
    { label: 'Active Missions', value: confirmedCount, icon: TrendingUp, color: 'text-emerald-500' },
    { label: 'Avg Speed', value: '38 km/h', icon: ShieldCheck, color: 'text-[var(--healthcare-cyan)]' },
  ];

  if (loading && !profile && requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse font-medium">Connecting to dispatcher telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SuspensionBanner details={user?.suspensionDetails} />
      
      {/* Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => setIsOnline(!isOnline)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
              isOnline 
                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-sm shadow-emerald-500/10' 
                : 'bg-muted text-muted-foreground border border-border'
            }`}
          >
            <Power className="w-5 h-5" />
            {isOnline ? 'Dispatcher Online' : 'Dispatcher Offline'}
          </button>
          <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-card border border-border font-bold hover:bg-muted transition-all">
            <Settings className="w-5 h-5" />
            Fleet Management
          </button>
        </div>

        <button
          onClick={() => fetchDashboardData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-card border border-border hover:bg-muted font-bold text-sm transition-all shadow-sm"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-500' : 'text-muted-foreground'}`} />
          <span>{refreshing ? 'Syncing...' : 'Sync Radar'}</span>
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
        {/* Active Emergency Requests */}
        <div className="lg:col-span-2 bg-card border border-border rounded-[40px] p-6 sm:p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-black">Emergency Requests</h3>
              {isOnline && (
                <span className="px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full text-xs font-bold animate-pulse flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  Live Radar
                </span>
              )}
            </div>
            <span className="text-xs font-bold text-muted-foreground">
              {requests.length} {requests.length === 1 ? 'Mission' : 'Missions'}
            </span>
          </div>

          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="p-16 text-center border border-dashed border-border rounded-3xl bg-muted/20">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-20 text-muted-foreground" />
                <p className="text-foreground font-bold text-base">No active emergency requests</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  When a user requests emergency assistance, missions will appear here in real-time.
                </p>
              </div>
            ) : (
              requests.map(req => {
                const patientName = req.userId?.name || req.details?.patientName || "Emergency Patient";
                const patientPhone = req.userId?.phone || req.details?.patientPhone || req.details?.phone;
                const pickupAddr = req.pickupLocation?.address || req.details?.pickupAddress || "Location Shared in App";
                const destAddr = req.destination?.address || req.details?.destinationAddress;
                const ambulanceType = req.details?.ambulanceType || 'Basic';
                const distance = req.details?.distance;
                const duration = req.details?.duration;
                const fare = req.details?.fare;
                const bookingTime = req.date || req.createdAt;

                return (
                  <div 
                    key={req._id} 
                    className="p-6 bg-muted/30 border border-border rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-[var(--healthcare-cyan)]/40 hover:bg-muted/50 transition-all shadow-sm"
                  >
                    <div className="flex gap-4 min-w-0 flex-1">
                      <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 shadow-sm">
                        <Ambulance className="w-7 h-7 text-red-500" />
                      </div>
                      
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-lg text-foreground truncate">{patientName}</p>
                          <span className="text-[10px] px-2.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-600 rounded-full font-black uppercase tracking-wider">
                            {ambulanceType} Tier
                          </span>
                          {bookingTime && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(bookingTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>

                        {patientPhone && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="w-3.5 h-3.5 text-cyan-500" />
                            <a href={`tel:${patientPhone}`} className="hover:text-cyan-500 font-medium transition-colors">
                              {patientPhone}
                            </a>
                          </div>
                        )}

                        <div className="space-y-1 pt-1 text-xs text-muted-foreground">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="text-foreground font-medium line-clamp-1">
                              <strong className="text-muted-foreground font-normal">Pickup: </strong>{pickupAddr}
                            </span>
                          </div>
                          {destAddr && (
                            <div className="flex items-start gap-2">
                              <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                              <span className="text-foreground font-medium line-clamp-1">
                                <strong className="text-muted-foreground font-normal">Drop: </strong>{destAddr}
                              </span>
                            </div>
                          )}
                        </div>

                        {(distance || duration || fare) && (
                          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-bold text-muted-foreground">
                            {distance && <span className="px-2 py-0.5 bg-muted rounded-md">{distance}</span>}
                            {duration && <span className="px-2 py-0.5 bg-muted rounded-md">{duration}</span>}
                            {fare && <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-md">₹{fare}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-none border-border">
                      <span className={`text-[10px] uppercase font-black px-3 py-1.5 rounded-full border ${
                        req.status === 'confirmed' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 
                        req.status === 'pending' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 
                        req.status === 'completed' ? 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' :
                        'bg-muted text-muted-foreground border-border'
                      }`}>
                        {req.status}
                      </span>
                      
                      <button 
                        onClick={() => setSelectedAppointment(req)}
                        className="p-3 bg-muted hover:bg-[var(--healthcare-cyan)] hover:text-white rounded-xl text-muted-foreground transition-all shadow-sm"
                        title="View Full Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      
                      {req.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleStatusChange(req._id, 'confirmed')}
                            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98]"
                            title="Accept Mission"
                          >
                            <Check className="w-4 h-4" /> Accept
                          </button>
                          <button 
                            onClick={() => handleStatusChange(req._id, 'cancelled')}
                            className="p-2.5 bg-accent hover:bg-red-500 hover:text-white text-muted-foreground rounded-xl transition-all"
                            title="Decline"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {req.status === 'confirmed' && (
                        <button 
                          onClick={() => handleStatusChange(req._id, 'completed')}
                          className="px-4 py-2.5 bg-[var(--healthcare-cyan)] hover:bg-[var(--healthcare-cyan-hover)] text-white rounded-xl font-bold text-xs shadow-md shadow-cyan-500/20 transition-all active:scale-[0.98]"
                        >
                          Mark Arrived
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Profile Sidebar */}
        <div className="bg-card border border-border rounded-[40px] p-6 sm:p-8 space-y-6">
          <h3 className="text-2xl font-black">Fleet Base</h3>
          <div className="space-y-6">
            <div className="p-6 bg-[var(--healthcare-cyan)]/5 border border-[var(--healthcare-cyan)]/20 rounded-3xl">
              <h4 className="font-bold mb-2">Service Identity</h4>
              <p className="text-xl font-black mb-1">{profile?.businessName || user?.name || 'Gwalior Emergency Ambulance'}</p>
              <p className="text-xs text-muted-foreground mb-4">License: {profile?.licenseNumber || 'AMB-MP-2026-001'}</p>
              <button className="w-full py-3 bg-white dark:bg-slate-800 border border-border rounded-xl text-sm font-bold hover:bg-muted transition-all">
                Edit Fleet Profile
              </button>
            </div>
            
            <div className="space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Base Operations</p>
              <div className="p-4 bg-muted/30 rounded-2xl">
                <p className="text-xs text-muted-foreground">Operational Zone</p>
                <p className="font-bold">{profile?.city || 'Gwalior, Madhya Pradesh'}</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-2xl">
                <p className="text-xs text-muted-foreground">Emergency Hotline</p>
                <p className="font-bold">{profile?.phone || user?.phone || '1800-NS-GWA'}</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-2xl">
                <p className="text-xs text-muted-foreground">Base Station</p>
                <p className="font-bold line-clamp-2 text-xs">{profile?.address || 'City Center, Gwalior'}</p>
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
    </div>
  );
}
