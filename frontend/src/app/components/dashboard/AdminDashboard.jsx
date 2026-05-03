import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "react-toastify";
import { 
  Users, UserCheck, UserX, Calendar, Activity, 
  Search, Filter, CheckCircle, XCircle, AlertCircle,
  MoreVertical, Shield, IndianRupee, Clock, MapPin,
  TrendingUp, Star, Phone, Mail, Award, FileText,
  UserPlus, UserMinus, RefreshCcw, Eye
} from "lucide-react";

import { adminAPI } from "../../utils/api";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [providers, setProviders] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending"); // Default to pending for verification
  const [providerType, setProviderType] = useState("doctor");
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    fees: 0,
    specialization: "",
    clinicAddress: "",
    about: ""
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const analyticsRes = await adminAPI.getAnalytics();
      setAnalytics(analyticsRes.data.data);

      if (activeTab === 'providers') {
        const providersRes = await adminAPI.getAllProviders({ 
          type: providerType,
          status: filterStatus 
        });
        setProviders(providersRes.data.data || []);
      } else if (activeTab === 'users') {
        const usersRes = await adminAPI.getAllUsers({ search: searchTerm });
        setUsers(usersRes.data.data || []);
      } else if (activeTab === 'bookings') {
        const bookingsRes = await adminAPI.getAllBookings();
        setBookings(bookingsRes.data.data || []);
      }
    } catch (error) {
      console.error("Dashboard Sync Error:", error);
      toast.error("Failed to sync admin dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, filterStatus, providerType, searchTerm]);

  const handleAction = async (type, id, extra = {}) => {
    try {
      setLoading(true);
      let res;
      switch(type) {
        case 'approve': 
          res = await adminAPI.approveProvider(providerType, id); 
          break;
        case 'suspend': 
          res = await adminAPI.suspendDoctor(id, extra.reason || "Policy violation"); 
          break;
        case 'delete': 
          if(window.confirm("Are you sure you want to delete this record?")) {
            res = await adminAPI.deleteUser(id);
          } else {
            setLoading(false);
            return;
          }
          break;
        default: 
          setLoading(false);
          return;
      }
      toast.success(res?.data?.message || "Action completed successfully");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const openProviderDetail = (provider) => {
    setSelectedProvider(provider);
    setIsModalOpen(true);
  };

  if (loading && !analytics) return (
    <div className="min-h-screen flex items-center justify-center bg-muted/5">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <RefreshCcw className="w-12 h-12 text-[var(--healthcare-cyan)] animate-spin" />
          <Shield className="w-5 h-5 text-[var(--healthcare-cyan)] absolute inset-0 m-auto" />
        </div>
        <p className="font-bold text-muted-foreground animate-pulse tracking-widest uppercase text-[10px]">Initializing Admin Core...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8 pb-20 pt-24 px-4 sm:px-6 lg:px-8 bg-muted/5 min-h-screen">
      {/* Header & Navigation */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="w-full xl:w-auto">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 md:w-10 md:h-10 text-[var(--healthcare-cyan)] shrink-0" />
            <span className="truncate">Admin Command</span>
          </h1>
          <p className="text-muted-foreground font-medium mt-1 text-sm md:text-base">Control NirogyaSathi network & partners.</p>
        </div>
        
        <div className="flex items-center gap-1.5 md:gap-2 bg-card border border-border p-1.5 md:p-2 rounded-2xl shadow-sm w-full xl:w-auto overflow-x-auto no-scrollbar">
          {['overview', 'providers', 'users', 'bookings'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold capitalize transition-all whitespace-nowrap flex-1 md:flex-none ${
                activeTab === tab 
                ? 'bg-[var(--healthcare-cyan)] text-white shadow-lg shadow-cyan-500/20' 
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <StatCard title="Total Patients" value={analytics?.totalUsers} icon={Users} color="cyan" trend="+12% this month" />
              <StatCard title="Active Doctors" value={analytics?.totalDoctors} icon={UserCheck} color="blue" trend="+5 new today" />
              <StatCard title="Pending Review" value={analytics?.pendingDoctors} icon={AlertCircle} color="orange" trend="Action required" />
              <StatCard title="Total Bookings" value={analytics?.totalBookings} icon={Calendar} color="green" trend="+120 this week" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              {/* Distribution & Insights */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-card border rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-sm">
                  <h3 className="text-lg font-black mb-6">Partner Distribution</h3>
                  <div className="space-y-4 md:space-y-6">
                    <ProgressBar label="Hospitals" value={analytics?.totalHospitals} total={analytics?.totalHospitals > 20 ? analytics.totalHospitals : 20} color="blue" />
                    <ProgressBar label="Labs" value={analytics?.totalLabs} total={analytics?.totalLabs > 50 ? analytics.totalLabs : 50} color="purple" />
                    <ProgressBar label="Blood Banks" value={analytics?.totalBloodBanks} total={analytics?.totalBloodBanks > 10 ? analytics.totalBloodBanks : 10} color="red" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white shadow-xl">
                  <h3 className="text-lg font-bold mb-4">Quick Insights</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="opacity-60 font-medium">Today's Appointments</span>
                      <span className="font-black text-xl text-cyan-400">{analytics?.todayBookings || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="opacity-60 font-medium">Suspended Accounts</span>
                      <span className="font-black text-xl text-red-400">{analytics?.suspendedDoctors || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Users */}
              <div className="lg:col-span-2 bg-card border rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-sm">
                <h3 className="text-lg font-black mb-6">New Patients Joined</h3>
                <div className="grid gap-4">
                  {analytics?.recentUsers?.map(user => (
                    <div key={user._id} className="flex items-center justify-between p-5 bg-muted/30 rounded-3xl hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} className="w-12 h-12 rounded-2xl object-cover shadow-sm" />
                        <div>
                          <p className="font-bold">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">{new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                  {(!analytics?.recentUsers || analytics.recentUsers.length === 0) && (
                    <p className="text-center py-10 text-muted-foreground font-bold">No recent signups found.</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'providers' && (
          <motion.div
            key="providers"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Filters Bar */}
            <div className="bg-card border rounded-[2rem] p-4 md:p-6 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-1.5 md:gap-2 bg-muted/50 p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto no-scrollbar">
                  {['doctor', 'ambulance', 'bloodbank', 'lab'].map(type => (
                    <button
                      key={type}
                      onClick={() => setProviderType(type)}
                      className={`px-3 md:px-4 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                        providerType === type 
                        ? 'bg-white text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <select 
                  className="bg-muted/50 border-none rounded-2xl py-3 px-4 font-bold text-xs md:text-sm outline-none cursor-pointer w-full sm:w-auto"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <button 
                onClick={fetchData}
                className="p-3 bg-[var(--healthcare-cyan)] text-white rounded-2xl shadow-lg shadow-cyan-500/20 active:scale-95 transition-all self-end md:self-auto"
              >
                <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Providers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {providers.map(p => (
                <motion.div 
                  key={p._id}
                  layout
                  className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm flex flex-col hover:shadow-xl transition-all group"
                >
                  <div className="flex items-center gap-5 mb-8">
                    <div className="relative">
                       <img 
                         src={p.userId?.avatar || `https://ui-avatars.com/api/?name=${p.businessName || p.userId?.name}`} 
                         className="w-16 h-16 rounded-[1.5rem] object-cover shadow-md border-2 border-background group-hover:scale-105 transition-transform" 
                       />
                       {p.verified && (
                         <div className="absolute -top-1 -right-1 bg-cyan-500 text-white rounded-full p-1 border-2 border-background">
                           <CheckCircle className="w-3 h-3" />
                         </div>
                       )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black truncate text-lg">{p.businessName || p.userId?.name}</h4>
                      <p className="text-[10px] font-black text-[var(--healthcare-cyan)] uppercase tracking-widest">{p.specialization || providerType}</p>
                    </div>
                    <button 
                      onClick={() => openProviderDetail(p)}
                      className="p-3 bg-muted/50 hover:bg-[var(--healthcare-cyan)]/10 hover:text-[var(--healthcare-cyan)] rounded-2xl transition-all"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4 mb-8 flex-1">
                    <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
                      <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
                        <MapPin className="w-4 h-4" />
                      </div>
                      {p.city}, {p.state}
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
                      <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
                        <Phone className="w-4 h-4" />
                      </div>
                      {p.phone}
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
                      <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      License: {p.licenseNumber}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {p.status === 'pending' ? (
                      <>
                        <button 
                          onClick={() => handleAction('approve', p._id)}
                          className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                        >
                          Approve Partner
                        </button>
                        <button 
                          onClick={() => handleAction('suspend', p._id, { reason: 'Rejected by admin' })}
                          className="p-4 bg-muted text-muted-foreground rounded-2xl hover:bg-red-500 hover:text-white transition-all group/btn"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <div className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-center ${
                        p.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                      }`}>
                        Account {p.status}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {providers.length === 0 && (
                <div className="col-span-full py-32 text-center bg-card border border-dashed border-border rounded-[3rem]">
                  <Activity className="w-20 h-20 text-muted-foreground/10 mx-auto mb-6" />
                  <p className="font-black text-muted-foreground text-xl">No {providerType}s found matching criteria.</p>
                  <p className="text-muted-foreground/60 mt-2">All caught up with verifications!</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-sm"
          >
            <div className="p-6 md:p-8 border-b bg-muted/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
               <h3 className="text-xl font-black">Patient Directory</h3>
               <div className="relative w-full sm:w-64">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                 <input 
                   type="text" 
                   placeholder="Search..." 
                   className="pl-12 pr-6 py-3 bg-white border border-border rounded-2xl text-sm outline-none focus:ring-2 ring-cyan-500/20 w-full transition-all"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
               </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-muted/30 text-muted-foreground text-[10px] font-black uppercase tracking-widest border-b">
                    <th className="px-8 py-6">Patient Details</th>
                    <th className="px-8 py-6">Contact & Email</th>
                    <th className="px-8 py-6">Joined Date</th>
                    <th className="px-8 py-6">Activity</th>
                    <th className="px-8 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {users.map(user => (
                    <tr key={user._id} className="hover:bg-muted/10 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <img 
                            src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} 
                            className="w-12 h-12 rounded-2xl object-cover shadow-sm border border-border" 
                          />
                          <div>
                            <p className="font-black text-sm">{user.name}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{user.gender || 'Not specified'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-bold">{user.email}</p>
                        <p className="text-xs text-muted-foreground">{user.phone || 'No phone'}</p>
                      </td>
                      <td className="px-8 py-6 text-sm font-medium">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 bg-[var(--healthcare-cyan)]/10 text-[var(--healthcare-cyan)] rounded-lg text-[10px] font-black uppercase tracking-wider">
                          {user.bookingsCount || 0} Bookings
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => handleAction('delete', user._id)}
                          className="p-3 text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                          title="Delete User"
                        >
                          <UserMinus className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-8 py-20 text-center text-muted-foreground font-bold">
                        No users found in the system.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'bookings' && (
          <motion.div
            key="bookings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border rounded-[3rem] overflow-hidden shadow-sm"
          >
            <div className="p-8 border-b bg-muted/10">
               <h3 className="text-xl font-black">Global Appointment Queue</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-muted/30 text-muted-foreground text-[10px] font-black uppercase tracking-widest border-b">
                    <th className="px-8 py-6">Patient</th>
                    <th className="px-8 py-6">Doctor</th>
                    <th className="px-8 py-6">Date & Time</th>
                    <th className="px-8 py-6">Status</th>
                    <th className="px-8 py-6 text-right">Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {bookings.map(booking => (
                    <tr key={booking._id} className="hover:bg-muted/10 transition-colors group">
                      <td className="px-8 py-6">
                        <p className="font-black text-sm">{booking.userId?.name}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">{booking.userId?.email}</p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="font-black text-sm text-[var(--healthcare-cyan)]">Dr. {booking.doctorId?.userId?.name}</p>
                      </td>
                      <td className="px-8 py-6 text-sm font-bold">
                        {new Date(booking.date).toLocaleDateString()} <span className="text-muted-foreground">at {booking.time}</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          booking.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <button className="p-3 text-muted-foreground hover:bg-muted rounded-2xl transition-all">
                           <MoreVertical className="w-5 h-5" />
                         </button>
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-8 py-32 text-center text-muted-foreground font-bold">
                        <Calendar className="w-16 h-16 mx-auto mb-4 opacity-10" />
                        No active bookings found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Partner Intelligence Modal */}
      <AnimatePresence>
        {isModalOpen && selectedProvider && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 sm:px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md" 
              onClick={() => { setIsModalOpen(false); setIsEditing(false); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-card border border-border w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem] md:rounded-[3.5rem] shadow-2xl p-6 md:p-16"
            >
              <div className="flex justify-between items-center mb-8 md:mb-12">
                <div className="flex items-center gap-2 md:gap-3">
                   <Shield className="w-6 h-6 md:w-8 md:h-8 text-[var(--healthcare-cyan)]" />
                   <h2 className="text-xl md:text-2xl font-black">Intelligence</h2>
                </div>
                <button 
                  onClick={() => { setIsModalOpen(false); setIsEditing(false); }} 
                  className="p-2 md:p-3 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all"
                >
                  <XCircle className="w-6 h-6 md:w-8 md:h-8" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16">
                 {/* Identity Card */}
                 <div className="md:col-span-1 space-y-6 md:space-y-10">
                    <div className="relative group">
                        <img 
                          src={selectedProvider.userId?.avatar || `https://ui-avatars.com/api/?name=${selectedProvider.businessName || selectedProvider.userId?.name}`} 
                          className="w-full aspect-square rounded-[2rem] md:rounded-[3rem] object-cover shadow-2xl border-4 border-background"
                        />
                    </div>
                    
                    <div className="space-y-4 md:space-y-6">
                       <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-3xl">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                            <Shield className="w-4 h-4 md:w-5 md:h-5 text-[var(--healthcare-cyan)]" />
                          </div>
                          <div>
                             <p className="text-[10px] font-black uppercase text-muted-foreground">Govt. License</p>
                             <p className="text-xs md:text-sm font-black">{selectedProvider.licenseNumber}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-3xl">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                            <Phone className="w-4 h-4 md:w-5 md:h-5 text-[var(--healthcare-cyan)]" />
                          </div>
                          <div>
                             <p className="text-[10px] font-black uppercase text-muted-foreground">Verified Contact</p>
                             <p className="text-xs md:text-sm font-black">{selectedProvider.phone}</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Information Panes */}
                 <div className="md:col-span-2 space-y-8 md:space-y-12">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                       <div>
                          <h3 className="text-3xl md:text-5xl font-black leading-tight tracking-tighter">
                             {selectedProvider.businessName || selectedProvider.userId?.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-2">
                             <div className="w-2 h-2 rounded-full bg-[var(--healthcare-cyan)] animate-pulse" />
                             <p className="text-sm md:text-lg font-black text-[var(--healthcare-cyan)] uppercase tracking-widest">{providerType} Partner</p>
                          </div>
                       </div>
                       <div className={`px-4 md:px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${
                         selectedProvider.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                       }`}>
                         {selectedProvider.status}
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 md:gap-8">
                       <DetailBox label="Public Rating" value={selectedProvider.rating ? `${selectedProvider.rating}/5` : 'New Entry'} icon={Star} />
                       <DetailBox label="Onboarded On" value={new Date(selectedProvider.createdAt).toLocaleDateString()} icon={Clock} />
                    </div>

                    <div className="space-y-4">
                       <h4 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3">
                         <MapPin className="w-4 h-4 text-red-500" /> Operational Base
                       </h4>
                       <div className="p-6 md:p-8 bg-muted/30 rounded-[2rem] md:rounded-[2.5rem] border border-border/50">
                         <p className="text-base md:text-lg font-bold leading-relaxed">
                           {selectedProvider.address}, {selectedProvider.city}
                         </p>
                         <p className="text-xs md:text-sm text-muted-foreground font-medium">{selectedProvider.state}, India</p>
                       </div>
                    </div>

                    {selectedProvider.description && (
                      <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Partner Briefing</h4>
                        <p className="text-lg text-muted-foreground font-medium leading-relaxed italic border-l-4 border-muted pl-6">
                          "{selectedProvider.description}"
                        </p>
                      </div>
                    )}

                    <div className="pt-8 border-t flex gap-4">
                       <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-black transition-all">
                         Download Documents
                       </button>
                       {selectedProvider.status === 'pending' && (
                         <button 
                           onClick={() => { handleAction('approve', selectedProvider._id); setIsModalOpen(false); }}
                           className="flex-1 py-4 bg-[var(--healthcare-cyan)] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-cyan-500/20 hover:scale-[1.02] transition-all"
                         >
                           Approve Activation
                         </button>
                       )}
                    </div>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Shared UI Primitives ───────────────────────────────────────────────────

function StatCard({ title, value, icon: Icon, color, trend }) {
  const colors = {
    cyan: 'bg-cyan-500/10 text-cyan-600',
    blue: 'bg-blue-500/10 text-blue-600',
    orange: 'bg-orange-500/10 text-orange-600',
    green: 'bg-green-500/10 text-green-600',
  }

  return (
    <div className="bg-card border border-border p-10 rounded-[3rem] shadow-sm hover:shadow-2xl hover:shadow-cyan-500/10 transition-all group relative overflow-hidden">
      <div className={`w-16 h-16 ${colors[color]} rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
        <Icon className="w-8 h-8" />
      </div>
      <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em]">{title}</p>
      <div className="flex items-baseline justify-between mt-3">
        <h3 className="text-5xl font-black tracking-tighter">{value || 0}</h3>
        <p className="text-[10px] font-black text-[var(--healthcare-cyan)] bg-[var(--healthcare-cyan)]/10 px-3 py-1.5 rounded-full uppercase tracking-widest">{trend}</p>
      </div>
    </div>
  );
}

function ProgressBar({ label, value, total, color }) {
  const percentages = {
    blue: 'bg-blue-500 shadow-blue-500/20',
    purple: 'bg-purple-500 shadow-purple-500/20',
    red: 'bg-red-500 shadow-red-500/20',
  }
  const pct = Math.min((value / total) * 100, 100);

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em]">
        <span>{label}</span>
        <span className="text-muted-foreground">{value || 0} / {total}</span>
      </div>
      <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden shadow-inner">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${pct || 0}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full ${percentages[color]} rounded-full shadow-lg`}
        />
      </div>
    </div>
  );
}

function DetailBox({ label, value, icon: Icon }) {
  return (
    <div className="bg-muted/30 p-6 rounded-[2rem] border border-transparent hover:border-[var(--healthcare-cyan)]/20 transition-all group">
      <div className="flex items-center gap-3 mb-3 text-muted-foreground">
        <Icon className="w-5 h-5 group-hover:text-[var(--healthcare-cyan)] transition-colors" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">{label}</span>
      </div>
      <p className="text-lg font-black tracking-tight">{value || 'N/A'}</p>
    </div>
  );
}
