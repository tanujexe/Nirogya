import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { toast } from 'react-toastify';
import { 
  User, Mail, Phone, Camera, MapPin, 
  Save, Loader2, ShieldCheck, Clock,
  Ambulance, Droplets, FlaskConical,
  Truck, Activity, Building2
} from 'lucide-react';
import { providerAPI, authAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function ProviderProfileSettings() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    avatar: '',
    businessName: '',
    description: '',
    address: '',
    city: '',
    state: '',
    workingHours: '',
    // Role specific fields
    vehicleCount: '',
    vehicleTypes: [],
    gpsEnabled: false,
    is24x7: false,
    inventory: {}, // for bloodbank
    homeCollection: false, // for lab
    testCategories: [], // for lab
    reportTime: '', // for lab
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await providerAPI.getProfile();
        const profile = res.data.data;
        if (profile) {
          setFormData({
            name: profile.userId?.name || '',
            phone: profile.userId?.phone || '',
            avatar: profile.userId?.avatar || '',
            businessName: profile.businessName || '',
            description: profile.description || '',
            address: profile.address || '',
            city: profile.city || '',
            state: profile.state || '',
            workingHours: profile.workingHours || '',
            vehicleCount: profile.vehicleCount || '',
            vehicleTypes: profile.vehicleTypes || [],
            gpsEnabled: profile.gpsEnabled || false,
            is24x7: profile.is24x7 || false,
            inventory: profile.inventory || {},
            homeCollection: profile.homeCollection || false,
            testCategories: profile.testCategories || [],
            reportTime: profile.reportTime || '',
          });
        }
      } catch (error) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleArrayChange = (name, value) => {
    const arr = formData[name];
    if (arr.includes(value)) {
      setFormData(prev => ({ ...prev, [name]: arr.filter(i => i !== value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: [...arr, value] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    // Clean data based on role to avoid validation errors
    const cleanedData = {
      name: formData.name,
      phone: formData.phone,
      avatar: formData.avatar,
      businessName: formData.businessName,
      description: formData.description,
      address: formData.address,
      city: formData.city,
      state: formData.state,
    };

    if (user.role === 'ambulance') {
      cleanedData.vehicleCount = Number(formData.vehicleCount) || 0;
      cleanedData.vehicleTypes = formData.vehicleTypes;
      cleanedData.gpsEnabled = formData.gpsEnabled;
      cleanedData.is24x7 = formData.is24x7;
    } else if (user.role === 'bloodbank') {
      cleanedData.inventory = formData.inventory;
    } else if (user.role === 'lab') {
      cleanedData.homeCollection = formData.homeCollection;
      cleanedData.testCategories = formData.testCategories;
      cleanedData.reportTime = formData.reportTime;
    }

    try {
      await providerAPI.updateProfile(cleanedData);
      await refreshUser();
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('avatar', file);

    setSaving(true);
    try {
      const res = await authAPI.uploadAvatar(uploadData);
      setFormData(prev => ({ ...prev, avatar: res.data.url }));
      toast.success('Photo uploaded! Save to apply changes.');
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen pt-32 flex justify-center"><Loader2 className="animate-spin text-cyan-500" /></div>;

  const roleIcons = {
    ambulance: Ambulance,
    bloodbank: Droplets,
    lab: FlaskConical
  };
  const RoleIcon = roleIcons[user.role] || Building2;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-muted/5">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-[var(--healthcare-cyan)]/10 rounded-2xl flex items-center justify-center text-[var(--healthcare-cyan)]">
            <RoleIcon className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black capitalize">{user.role} Dashboard</h1>
            <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">Profile & Operations Manager</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Main Info */}
          <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-xl">
             <div className="flex flex-col md:flex-row gap-8 items-center mb-8">
                <div className="relative group">
                  <img 
                    src={formData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`} 
                    className="w-32 h-32 rounded-3xl object-cover ring-4 ring-background shadow-2xl" 
                  />
                  <button 
                    type="button"
                    onClick={() => document.getElementById('avatar-input').click()}
                    className="absolute -bottom-2 -right-2 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-border text-[var(--healthcare-cyan)] hover:scale-110 transition-all"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  <input id="avatar-input" type="file" hidden accept="image/*" onChange={handleAvatarUpload} />
                </div>
                
                <div className="flex-1 space-y-4 w-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Public Representative Name</label>
                      <input name="name" value={formData.name} onChange={handleChange} className="w-full p-3 bg-muted/50 border rounded-xl" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Business Phone</label>
                      <input name="phone" value={formData.phone} onChange={handleChange} className="w-full p-3 bg-muted/50 border rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Business / Organization Name</label>
                    <input name="businessName" value={formData.businessName} onChange={handleChange} className="w-full p-3 bg-muted/50 border rounded-xl font-bold" />
                  </div>
                </div>
             </div>

             <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Short Description</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full p-3 bg-muted/50 border rounded-xl resize-none" placeholder="Tell users about your services..." />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Full Address</label>
                    <input name="address" value={formData.address} onChange={handleChange} className="w-full p-3 bg-muted/50 border rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">City</label>
                    <input name="city" value={formData.city} onChange={handleChange} className="w-full p-3 bg-muted/50 border rounded-xl" />
                  </div>
                </div>
             </div>
          </div>

          {/* Role Specific Settings */}
          {user.role === 'ambulance' && (
            <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-xl space-y-6">
              <h2 className="text-xl font-black flex items-center gap-2">
                <Truck className="w-6 h-6 text-blue-500" />
                Fleet Management
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Number of Vehicles</label>
                  <input type="number" name="vehicleCount" value={formData.vehicleCount} onChange={handleChange} className="w-full p-3 bg-muted/50 border rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Capabilities</label>
                  <div className="flex flex-wrap gap-2">
                    {['Basic', 'Oxygen', 'ICU', 'Ventilator'].map(type => (
                      <button 
                        key={type}
                        type="button"
                        onClick={() => handleArrayChange('vehicleTypes', type)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${formData.vehicleTypes.includes(type) ? 'bg-blue-500 text-white border-blue-500 shadow-lg' : 'bg-muted/50 border-border'}`}
                      >
                        {type} Support
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-8 pt-4">
                 <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" name="is24x7" checked={formData.is24x7} onChange={handleChange} className="w-5 h-5 rounded accent-blue-500" />
                    <span className="text-sm font-bold uppercase tracking-widest">24/7 Availability</span>
                 </label>
                 <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" name="gpsEnabled" checked={formData.gpsEnabled} onChange={handleChange} className="w-5 h-5 rounded accent-blue-500" />
                    <span className="text-sm font-bold uppercase tracking-widest">GPS Tracking Active</span>
                 </label>
              </div>
            </div>
          )}

          {user.role === 'bloodbank' && (
            <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-xl space-y-6">
              <h2 className="text-xl font-black flex items-center gap-2">
                <Droplets className="w-6 h-6 text-rose-500" />
                Inventory Management
              </h2>
              <p className="text-sm text-muted-foreground italic">Current stock levels visible to the public.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(group => (
                  <div key={group} className="space-y-1">
                    <label className="text-xs font-black text-rose-500 ml-1">{group}</label>
                    <input 
                      type="number" 
                      value={formData.inventory?.[group] || 0} 
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        inventory: { ...prev.inventory, [group]: e.target.value }
                      }))}
                      className="w-full p-3 bg-muted/50 border rounded-xl text-center font-bold"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {user.role === 'lab' && (
            <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-xl space-y-6">
              <h2 className="text-xl font-black flex items-center gap-2">
                <FlaskConical className="w-6 h-6 text-emerald-500" />
                Lab Configuration
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Report Turnaround Time</label>
                    <input name="reportTime" value={formData.reportTime} onChange={handleChange} placeholder="e.g. 24-48 Hours" className="w-full p-3 bg-muted/50 border rounded-xl" />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" name="homeCollection" checked={formData.homeCollection} onChange={handleChange} className="w-5 h-5 rounded accent-emerald-500" />
                    <span className="text-sm font-bold uppercase tracking-widest">Home Sample Collection</span>
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Test Categories</label>
                  <div className="flex flex-wrap gap-2">
                    {['Blood Test', 'Radiology', 'Pathology', 'Molecular', 'Biochemical'].map(cat => (
                      <button 
                        key={cat}
                        type="button"
                        onClick={() => handleArrayChange('testCategories', cat)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${formData.testCategories.includes(cat) ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-muted/50 border-border'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4">
             <button
               type="submit"
               disabled={saving}
               className="flex-1 py-5 bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] text-white font-black rounded-[2rem] shadow-2xl shadow-cyan-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
             >
               {saving ? <Loader2 className="animate-spin" /> : <><Save className="w-6 h-6" /> Commit Profile Updates</>}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
