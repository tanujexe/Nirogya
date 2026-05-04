import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { toast } from 'react-toastify';
import { 
  User, Mail, Phone, Camera, MapPin, Award, 
  Stethoscope, FileText, IndianRupee, Save, 
  Loader2, CheckCircle2, ShieldCheck
} from 'lucide-react';
import { doctorsAPI, authAPI, adminAPI, default as api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function DoctorProfileSettings() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doctorData, setDoctorData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    avatar: '',
    specialization: '',
    experience: '',
    fees: '',
    qualification: '',
    about: '',
    clinicAddress: '',
    licenseNumber: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authAPI.getProfile();
        const fullUser = res.data.data;
        const profile = fullUser.doctorProfile || {};
        
        setDoctorData(profile);
        setFormData({
          name: fullUser.name || '',
          phone: fullUser.phone || '',
          avatar: fullUser.avatar || '',
          specialization: profile.specialization || '',
          experience: profile.experience || '',
          fees: profile.fees || '',
          qualification: profile.qualification || '',
          about: profile.about || '',
          clinicAddress: profile.clinicAddress || '',
          licenseNumber: profile.licenseNumber || '',
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await doctorsAPI.updateProfile(formData);
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

    const formData = new FormData();
    formData.append('avatar', file);

    setSaving(true);
    try {
      const res = await doctorsAPI.uploadAvatar(formData);
      setFormData(prev => ({ ...prev, avatar: res.data.url }));
      toast.success('Photo uploaded! Save to apply changes.');
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--healthcare-cyan)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-muted/5">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Professional Profile</h1>
            <p className="text-muted-foreground">Manage your professional identity and clinical information.</p>
          </div>
          <div className="flex items-center gap-2 bg-[var(--healthcare-green)]/10 text-[var(--healthcare-green)] px-4 py-2 rounded-xl text-sm font-bold">
            <ShieldCheck className="w-4 h-4" />
            Verified Practitioner
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Header Section: Avatar & Basic Info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-[2.5rem] p-8 shadow-xl shadow-cyan-500/5 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-[var(--healthcare-cyan)]/10 to-[var(--healthcare-blue)]/10" />
            
            <div className="relative flex flex-col md:flex-row items-center gap-8">
              <div className="relative group">
                <img 
                  src={formData.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=doctor'} 
                  alt="Profile" 
                  className="w-32 h-32 rounded-3xl object-cover ring-4 ring-background shadow-2xl"
                />
                <button 
                  type="button"
                  onClick={() => document.getElementById('avatar-input').click()}
                  className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-lg border border-border text-[var(--healthcare-cyan)] hover:scale-110 transition-transform"
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

              <div className="flex-1 space-y-4 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input 
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border rounded-2xl focus:ring-2 focus:ring-[var(--healthcare-cyan)] outline-none transition-all"
                        placeholder="Dr. Name"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Phone Number</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input 
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border rounded-2xl focus:ring-2 focus:ring-[var(--healthcare-cyan)] outline-none transition-all"
                        placeholder="+91 00000 00000"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Professional Details */}
            <div className="lg:col-span-2 space-y-8">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-card border border-border rounded-[2.5rem] p-8 shadow-lg space-y-6"
              >
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-[var(--healthcare-cyan)]" />
                  Clinical Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Specialization</label>
                    <input 
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-muted/30 border border-border rounded-2xl focus:ring-2 focus:ring-[var(--healthcare-cyan)] outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Qualification</label>
                    <div className="relative group">
                      <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input 
                        name="qualification"
                        value={formData.qualification}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border rounded-2xl focus:ring-2 focus:ring-[var(--healthcare-cyan)] outline-none"
                        placeholder="MBBS, MD"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Experience (Years)</label>
                    <input 
                      type="number"
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-muted/30 border border-border rounded-2xl focus:ring-2 focus:ring-[var(--healthcare-cyan)] outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Consultation Fees (₹)</label>
                    <div className="relative group">
                      <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input 
                        type="number"
                        name="fees"
                        value={formData.fees}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border rounded-2xl focus:ring-2 focus:ring-[var(--healthcare-cyan)] outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Professional Bio</label>
                  <textarea 
                    name="about"
                    value={formData.about}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-muted/30 border border-border rounded-2xl focus:ring-2 focus:ring-[var(--healthcare-cyan)] outline-none resize-none"
                    placeholder="Tell patients about your expertise, treatment philosophy, and achievements..."
                  />
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card border border-border rounded-[2.5rem] p-8 shadow-lg space-y-6"
              >
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[var(--healthcare-cyan)]" />
                  Clinic Details
                </h2>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Clinic/Hospital Address</label>
                  <textarea 
                    name="clinicAddress"
                    value={formData.clinicAddress}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-4 py-3 bg-muted/30 border border-border rounded-2xl focus:ring-2 focus:ring-[var(--healthcare-cyan)] outline-none resize-none"
                    placeholder="Full address of your primary clinic or hospital..."
                  />
                </div>
              </motion.div>
            </div>

            {/* Right: Verification & Status */}
            <div className="space-y-8">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-card border border-border rounded-[2.5rem] p-8 shadow-lg"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-[var(--healthcare-cyan)]/10 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[var(--healthcare-cyan)]" />
                  </div>
                  <h2 className="text-xl font-bold">Verification</h2>
                </div>

                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">License Number</label>
                    <input 
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      disabled
                      className="w-full px-4 py-3 bg-muted border border-border rounded-2xl text-muted-foreground cursor-not-allowed font-mono"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">License numbers cannot be changed once verified. Contact support for updates.</p>
                  </div>

                  <div className="p-4 bg-[var(--healthcare-green)]/5 rounded-2xl border border-[var(--healthcare-green)]/10">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[var(--healthcare-green)] mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-[var(--healthcare-green)]">Profile Active</p>
                        <p className="text-xs text-muted-foreground">Your profile is visible to patients and available for bookings.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-5 rounded-[2rem] bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] text-white font-black text-xl shadow-2xl shadow-cyan-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {saving ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Save className="w-6 h-6" />
                    Save Professional Profile
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
