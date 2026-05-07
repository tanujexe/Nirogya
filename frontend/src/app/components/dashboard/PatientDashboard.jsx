import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Calendar, Clock, Activity, FileText, Droplet, Navigation, ShieldCheck, ArrowRight, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { bookingsAPI } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import SuspensionBanner from "../common/SuspensionBanner";

export default function PatientDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await bookingsAPI.getUpcoming();
        setAppointments(res.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch appointments:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await bookingsAPI.cancel(bookingId, "User requested cancellation");
      toast.success("Appointment cancelled successfully");
      setAppointments(prev => prev.map(apt => apt._id === bookingId ? { ...apt, status: 'cancelled' } : apt));
    } catch (error) {
      toast.error("Failed to cancel appointment");
    }
  }

  const { user } = useAuth();

  return (
    <div className="space-y-12">
      <SuspensionBanner details={user?.suspensionDetails} />
      
      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { name: 'Doctors', path: '/doctors', icon: Calendar, color: 'text-cyan-500', bg: 'bg-cyan-50' },
          { name: 'Hospitals', path: '/hospitals', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' },
          { name: 'Blood Bank', path: '/blood-bank', icon: Droplet, color: 'text-red-500', bg: 'bg-red-50' },
          { name: 'Ambulances', path: '/ambulance', icon: Navigation, color: 'text-orange-500', bg: 'bg-orange-50' },
          { name: 'Medical Vault', path: '/vault', icon: ShieldCheck, color: 'text-purple-500', bg: 'bg-purple-50' },
        ].map((action) => (
          <Link
            key={action.name}
            to={action.path}
            className={`flex flex-col items-center justify-center p-6 rounded-3xl bg-card border border-border hover:border-[var(--healthcare-cyan)] hover:shadow-xl hover:shadow-cyan-500/5 transition-all group`}
          >
            <div className={`p-4 rounded-2xl ${action.bg} ${action.color} mb-3 group-hover:scale-110 transition-transform`}>
              <action.icon className="w-7 h-7" />
            </div>
            <span className="text-sm font-bold tracking-tight">{action.name}</span>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Appointments Section */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-black flex items-center gap-3">
            <div className="w-1.5 h-8 bg-[var(--healthcare-cyan)] rounded-full" />
            Active Appointments
          </h2>
          
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => <div key={i} className="animate-pulse h-32 bg-card border border-border rounded-3xl" />)}
            </div>
          ) : appointments.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-3xl p-12 text-center text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-bold">No upcoming appointments</p>
              <Link to="/doctors" className="text-sm text-[var(--healthcare-cyan)] hover:underline mt-2 inline-block font-bold">Book a consultation now</Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {appointments.map((appointment) => (
                <div key={appointment._id} className="bg-card border border-border rounded-3xl p-6 hover:shadow-lg hover:shadow-cyan-500/5 transition-all group">
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border ${
                        appointment.type === 'doctor' ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/5' :
                        appointment.type === 'ambulance' ? 'bg-red-500/10 text-red-500 border-red-500/5' :
                        appointment.type === 'bloodbank' ? 'bg-rose-500/10 text-rose-500 border-rose-500/5' :
                        'bg-emerald-500/10 text-emerald-500 border-emerald-500/5'
                      }`}>
                        {appointment.type === 'doctor' ? <Calendar className="w-7 h-7" /> :
                         appointment.type === 'ambulance' ? <Navigation className="w-7 h-7" /> :
                         appointment.type === 'bloodbank' ? <Droplet className="w-7 h-7" /> :
                         <Activity className="w-7 h-7" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg group-hover:text-[var(--healthcare-cyan)] transition-colors">
                          {appointment?.providerId?.businessName || appointment?.providerId?.userId?.name || 'Healthcare Provider'}
                        </h3>
                        <p className={`text-sm font-bold uppercase tracking-wider ${
                          appointment.type === 'doctor' ? 'text-cyan-500/70' :
                          appointment.type === 'ambulance' ? 'text-red-500/70' :
                          appointment.type === 'bloodbank' ? 'text-rose-500/70' :
                          'text-emerald-500/70'
                        }`}>
                          {appointment?.type || 'Appointment'} {appointment?.providerId?.specialization ? `• ${appointment.providerId.specialization}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border ${
                      appointment.status === 'confirmed' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                      appointment.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
                      appointment.status === 'cancelled' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                      'bg-muted text-muted-foreground border-border'
                    }`}>
                      {appointment?.status || 'unknown'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm font-medium text-muted-foreground mb-6 bg-muted/30 p-4 rounded-2xl border border-border/50">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[var(--healthcare-cyan)]" />
                      {appointment?.date ? new Date(appointment.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'Date TBD'}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[var(--healthcare-cyan)]" />
                      {appointment?.timeSlot || appointment?.time || 'Time TBD'}
                    </span>
                  </div>

                  {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                    <button 
                      onClick={() => handleCancelBooking(appointment._id)}
                      className="w-full py-3 text-sm font-bold text-red-500 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-2xl transition-all active:scale-[0.98]"
                    >
                      Cancel Appointment
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Smart Medical Vault Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black flex items-center gap-3">
            <div className="w-1.5 h-8 bg-purple-500 rounded-full" />
            Security Vault
          </h2>
          
          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[2rem] p-8 text-white shadow-xl shadow-purple-500/20 relative overflow-hidden group">
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white dark:bg-slate-800/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-400/20 rounded-full -ml-12 -mb-12 blur-xl" />
            
            <div className="relative z-10">
              <div className="w-14 h-14 bg-white dark:bg-slate-800/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/20 shadow-xl">
                <Shield className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-2xl font-black mb-3">Smart Medical Vault</h3>
              <p className="text-purple-100/80 text-sm leading-relaxed mb-8">
                Your medical history, secured with military-grade encryption. Store reports and share them selectively with doctors.
              </p>
              
              <ul className="space-y-3 mb-8">
                {['Encrypted Storage', 'Selective Sharing', 'Lab Integration', 'Instant PDF Preview'].map(item => (
                  <li key={item} className="flex items-center gap-2 text-xs font-bold text-purple-100">
                    <Check className="w-3.5 h-3.5 text-purple-300" />
                    {item}
                  </li>
                ))}
              </ul>
              
              <Link 
                to="/vault" 
                className="w-full py-4 bg-white dark:bg-slate-800 text-purple-700 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl hover:bg-purple-50 transition-all active:scale-[0.98]"
              >
                Enter Your Vault
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="bg-card border border-border rounded-3xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-orange-100 text-orange-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold">Privacy First</p>
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Zero Knowledge Sharing</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Doctors only see what you share. You have 100% control over your medical data at all times.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Check({ className }) {
  return (
    <svg 
      className={className} 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor" 
      strokeWidth={3}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
