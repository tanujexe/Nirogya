import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Droplets, 
  Settings, 
  TrendingUp, 
  ShieldCheck,
  Plus,
  RefreshCw,
  AlertCircle,
  Truck
} from 'lucide-react';

export default function BloodBankDashboard() {
  const [inventory, setInventory] = useState({
    'A+': 12, 'A-': 5, 'B+': 18, 'B-': 3,
    'O+': 25, 'O-': 8, 'AB+': 7, 'AB-': 2
  });

  const stats = [
    { label: 'Units Stock', value: Object.values(inventory).reduce((a, b) => a + b, 0), icon: Droplets, color: 'text-rose-500' },
    { label: 'Active Requests', value: '05', icon: Truck, color: 'text-blue-500' },
    { label: 'Monthly Growth', value: '+14%', icon: TrendingUp, color: 'text-emerald-500' },
    { label: 'Compliance', value: '100%', icon: ShieldCheck, color: 'text-[var(--healthcare-cyan)]' },
  ];

  return (
    <div className="space-y-8">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-rose-500 text-white font-bold hover:shadow-lg hover:shadow-rose-500/20 transition-all">
          <Plus className="w-5 h-5" />
          Add Donation Record
        </button>
        <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-card border border-border font-bold hover:bg-muted transition-all">
          <RefreshCw className="w-5 h-5" />
          Update Inventory
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
        {/* Inventory Grid */}
        <div className="lg:col-span-2 bg-card border border-border rounded-[40px] p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black text-rose-500">Live Inventory</h3>
            <button className="text-sm font-bold text-[var(--healthcare-cyan)] hover:underline">View History</button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(inventory).map(([group, count]) => (
              <div key={group} className="p-6 bg-muted/30 border border-border rounded-3xl text-center group hover:border-rose-500/30 transition-all">
                <p className="text-xl font-black text-rose-500 mb-2">{group}</p>
                <h4 className="text-2xl font-black">{count}</h4>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Units</p>
                
                <div className="mt-4 pt-4 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity flex justify-center gap-2">
                  <button className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold text-lg">+</button>
                  <button className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center font-bold text-lg">-</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Urgent Alerts */}
        <div className="bg-card border border-border rounded-[40px] p-8">
          <div className="flex items-center gap-2 mb-8">
            <AlertCircle className="w-6 h-6 text-orange-500" />
            <h3 className="text-2xl font-black">Low Stock Alerts</h3>
          </div>
          
          <div className="space-y-4">
            {Object.entries(inventory).filter(([_, count]) => count < 5).map(([group, _]) => (
              <div key={group} className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl flex items-center justify-between">
                <span className="font-bold text-orange-600">{group} Group Low</span>
                <button className="px-3 py-1 bg-orange-500 text-white text-[10px] font-bold rounded-lg uppercase">Restock</button>
              </div>
            ))}
            
            {Object.entries(inventory).filter(([_, count]) => count < 5).length === 0 && (
              <div className="py-12 text-center">
                <ShieldCheck className="w-12 h-12 text-emerald-500/30 mx-auto mb-4" />
                <p className="text-sm font-bold text-muted-foreground">All stocks healthy</p>
              </div>
            )}
          </div>

          <div className="mt-12 space-y-4">
            <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Quick Settings</h4>
            <label className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl cursor-pointer">
              <span className="text-sm font-medium">Home Delivery</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded-lg border-border text-rose-500" />
            </label>
            <label className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl cursor-pointer">
              <span className="text-sm font-medium">Emergency Window</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded-lg border-border text-rose-500" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
