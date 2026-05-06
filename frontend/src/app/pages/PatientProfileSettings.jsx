import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { toast } from 'react-toastify';
import { User, Mail, Phone, MapPin, Save, Loader2, Heart, Camera } from 'lucide-react';
import { authAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function PatientProfileSettings() {
  const { user: authUser, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    }
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authAPI.getProfile();
        const data = res.data.data;
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          avatar: data.avatar || '',
          address: data.address || { street: '', city: '', state: '', zipCode: '' }
        });
      } catch (error) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authAPI.updateProfile(formData);
      if (refreshUser) await refreshUser();
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('avatar', file);

    setSaving(true);
    try {
      // Import api from utils/api if not already available
      const res = await authAPI.uploadAvatar(formDataUpload);
      setFormData(prev => ({ ...prev, avatar: res.data.url }));
      toast.success('Photo uploaded! Save to apply changes.');
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen pt-24 flex justify-center items-center"><Loader2 className="animate-spin text-[var(--healthcare-cyan)]" /></div>;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-muted/5">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-black mb-8">My Profile</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-xl">
             <div className="flex justify-center mb-8">
                <div className="relative group">
                  <div className="relative">
                    <img 
                      src={formData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`} 
                      className="w-32 h-32 rounded-[2rem] object-cover ring-4 ring-background shadow-2xl" 
                    />
                    <button 
                      type="button"
                      onClick={() => document.getElementById('avatar-input').click()}
                      className="absolute -bottom-2 -right-2 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-border text-[var(--healthcare-cyan)] hover:scale-110 transition-all"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                    <input 
                      id="avatar-input"
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleAvatarUpload}
                    />
                  </div>
                </div>
             </div>

             <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Full Name</label>
                    <input name="name" value={formData.name} onChange={handleChange} className="w-full p-3 bg-muted/50 border rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Email (Private)</label>
                    <input value={formData.email} disabled className="w-full p-3 bg-muted border rounded-xl text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Phone</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} className="w-full p-3 bg-muted/50 border rounded-xl" />
                </div>

                <div className="pt-4 border-t border-border mt-6">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[var(--healthcare-cyan)]" />
                    Mailing Address
                  </h3>
                  <div className="space-y-4">
                    <input name="address.street" value={formData.address?.street} onChange={handleChange} placeholder="Street Address" className="w-full p-3 bg-muted/50 border rounded-xl" />
                    <div className="grid grid-cols-3 gap-2">
                      <input name="address.city" value={formData.address?.city} onChange={handleChange} placeholder="City" className="w-full p-3 bg-muted/50 border rounded-xl" />
                      <input name="address.state" value={formData.address?.state} onChange={handleChange} placeholder="State" className="w-full p-3 bg-muted/50 border rounded-xl" />
                      <input name="address.zipCode" value={formData.address?.zipCode} onChange={handleChange} placeholder="ZIP" className="w-full p-3 bg-muted/50 border rounded-xl" />
                    </div>
                  </div>
                </div>
             </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="animate-spin" /> : <><Save className="w-5 h-5" /> Save Changes</>}
          </button>
        </form>
      </div>
    </div>
  );
}
