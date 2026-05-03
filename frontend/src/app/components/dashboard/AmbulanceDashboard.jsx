import { useState } from 'react';
import { motion } from 'motion/react';
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
  Power
} from 'lucide-react';

export default function AmbulanceDashboard() {
  const [isOnline, setIsOnline] = useState(true);
  
  const stats = [
    { label: 'Total Fleet', value: '12', icon: Ambulance, color: 'text-blue-500' },
    { label: 'Active Requests', value: '03', icon: Bell, color: 'text-red-500' },
    { label: 'Services Today', value: '08', icon: TrendingUp, color: 'text-emerald-500' },
    { label: 'Response Avg', value: '14m', icon: ShieldCheck, color: 'text-[var(--healthcare-cyan)]' },
  ];

  const requests = [
    { id: 1, type: 'ICU Support', patient: 'Rahul Sharma', distance: '1.2 km', location: 'Bandra West, Mumbai', status: 'pending' },
    { id: 2, type: 'Basic Life Support', patient: 'Anjali Gupta', distance: '3.5 km', location: 'Andheri East, Mumbai', status: 'pending' },
  ];

  return (
    <div className="space-y-8">
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
            <span className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-xs font-bold animate-pulse">Live</span>
          </div>

          <div className="space-y-4">
            {requests.map(req => (
              <div key={req.id} className="p-6 bg-muted/30 border border-border rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:bg-muted/50 transition-all">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0">
                    <Ambulance className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold">{req.patient}</p>
                      <span className="text-[10px] px-2 py-0.5 bg-accent rounded font-bold uppercase">{req.type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {req.location}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right mr-4 hidden md:block">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Distance</p>
                    <p className="font-black text-[var(--healthcare-cyan)]">{req.distance}</p>
                  </div>
                  <button className="p-4 bg-emerald-500 text-white rounded-2xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all">
                    <Check className="w-5 h-5" />
                  </button>
                  <button className="p-4 bg-accent text-muted-foreground rounded-2xl hover:bg-red-500 hover:text-white transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fleet Sidebar */}
        <div className="bg-card border border-border rounded-[40px] p-8">
          <h3 className="text-2xl font-black mb-8">Quick Service</h3>
          <div className="space-y-6">
            <div className="p-6 bg-[var(--healthcare-cyan)]/5 border border-[var(--healthcare-cyan)]/20 rounded-3xl">
              <h4 className="font-bold mb-2">Primary Contact</h4>
              <p className="text-2xl font-black mb-4">+91 98765 43210</p>
              <button className="w-full py-3 bg-white border border-border rounded-xl text-sm font-bold hover:bg-muted transition-all">
                Update Contact
              </button>
            </div>
            
            <div className="space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Settings</p>
              <label className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl cursor-pointer">
                <span className="text-sm font-medium">24/7 Availability</span>
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded-lg border-border text-[var(--healthcare-cyan)]" />
              </label>
              <label className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl cursor-pointer">
                <span className="text-sm font-medium">GPS Tracking</span>
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded-lg border-border text-[var(--healthcare-cyan)]" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
