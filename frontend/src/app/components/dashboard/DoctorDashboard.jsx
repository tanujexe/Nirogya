import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Calendar, User, Clock, Eye, ChevronRight, FileText, Settings, ShieldCheck, Star, Users } from "lucide-react";
import { bookingsAPI, providerAPI } from "../../utils/api";
import AppointmentDetailsModal from "./AppointmentDetailsModal";
import ProviderProfileModal from "./ProviderProfileModal";
import { useAuth } from "../../context/AuthContext";
import SuspensionBanner from "../common/SuspensionBanner";

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, profileRes] = await Promise.all([
        bookingsAPI.getAll(),
        providerAPI.getProfile()
      ]);
      setAppointments(bookingsRes.data?.data || []);
      setProfile(profileRes.data?.data);
    } catch (error) {
      console.error("Failed to fetch doctor dashboard data:", error);
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
      toast.success(`Appointment ${newStatus}`);
      setAppointments((prev) =>
        prev.map((apt) =>
          apt._id === bookingId ? { ...apt, status: newStatus } : apt
        )
      );
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  if (loading && !profile) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-12 h-12 border-4 border-[var(--healthcare-cyan)] border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground animate-pulse font-medium">Loading your medical workspace...</p>
    </div>
  );

  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <SuspensionBanner details={user?.suspensionDetails} />
      
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-3xl p-6 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-500">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Patients Served</p>
            <h3 className="text-2xl font-black">{appointments.filter(a => a.status === 'completed').length}</h3>
          </div>
        </div>
        <div className="bg-card border border-border rounded-3xl p-6 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-yellow-500/10 text-yellow-500">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Average Rating</p>
            <h3 className="text-2xl font-black">{profile?.rating || '0.0'}</h3>
          </div>
        </div>
        <button 
          onClick={() => setIsProfileModalOpen(true)}
          className="bg-card border border-border rounded-3xl p-6 flex items-center gap-4 hover:border-cyan-500/50 transition-all group"
        >
          <div className="p-3 rounded-2xl bg-muted text-muted-foreground group-hover:bg-cyan-500 group-hover:text-white transition-all">
            <Settings className="w-6 h-6" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Profile Settings</p>
            <h3 className="text-lg font-black group-hover:text-cyan-500 transition-all">Edit Professional Info</h3>
          </div>
        </button>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black">Upcoming Appointments</h2>
        <div className="px-4 py-2 bg-muted rounded-xl text-sm font-bold text-muted-foreground">
          {appointments.filter(a => a.status === 'confirmed').length} Active Appointments
        </div>
      </div>

      <div className="space-y-4">
        {appointments.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-3xl p-16 text-center text-muted-foreground">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-xl font-bold">No upcoming appointments</p>
            <p className="text-sm">Your schedule is currently clear.</p>
          </div>
        ) : (
          appointments.map((appointment) => (
            <div 
              key={appointment._id} 
              className="bg-card border border-border rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-300"
            >
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--healthcare-cyan)]/20 to-[var(--healthcare-blue)]/20 flex items-center justify-center text-[var(--healthcare-cyan)] font-black text-2xl border border-[var(--healthcare-cyan)]/10">
                  {appointment.userId?.name?.charAt(0) || "P"}
                </div>
                <div>
                  <h3 className="font-bold text-xl flex items-center gap-2 group-hover:text-[var(--healthcare-cyan)] transition-colors">
                    {appointment.userId?.name || "Patient"}
                  </h3>
                  <div className="text-sm text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-6 gap-y-2">
                    <span className="flex items-center gap-2 font-medium">
                      <Calendar className="w-4 h-4 text-[var(--healthcare-cyan)]" />
                      {new Date(appointment.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-2 font-medium">
                      <Clock className="w-4 h-4 text-[var(--healthcare-cyan)]" />
                      {appointment.timeSlot || appointment.time || 'TBD'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto border-t md:border-none pt-4 md:pt-0">
                <div className="flex flex-col items-end gap-3 flex-1 md:flex-none">
                  <span className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded-full font-black border ${
                    appointment.status === 'confirmed' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                    appointment.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
                    appointment.status === 'cancelled' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                    'bg-muted text-muted-foreground border-border'
                  }`}>
                    {appointment.status}
                  </span>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSelectedAppointment(appointment)}
                      className="p-2.5 bg-muted rounded-xl text-muted-foreground hover:bg-[var(--healthcare-cyan)] hover:text-white transition-all shadow-sm"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>

                    {appointment.status === "pending" && (
                      <>
                        <button 
                          onClick={() => handleStatusChange(appointment._id, 'confirmed')}
                          className="px-4 py-2.5 text-sm bg-[var(--healthcare-cyan)] text-white rounded-xl font-bold hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
                        >
                          Confirm
                        </button>
                        <button 
                          onClick={() => handleStatusChange(appointment._id, 'cancelled')}
                          className="px-4 py-2.5 text-sm bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold hover:bg-red-100 transition-all"
                        >
                          Decline
                        </button>
                      </>
                    )}
                    
                    {appointment.status === "confirmed" && (
                      <button 
                        onClick={() => handleStatusChange(appointment._id, 'completed')}
                        className="px-4 py-2.5 text-sm bg-[var(--healthcare-green)] text-white rounded-xl font-bold hover:shadow-lg hover:shadow-green-500/20 transition-all"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-muted-foreground/30 hidden md:block" />
              </div>
            </div>
          ))
        )}
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

