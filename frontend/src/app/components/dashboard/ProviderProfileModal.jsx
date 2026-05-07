import { useState, useEffect } from "react";
import { X, Save, AlertCircle } from "lucide-react";
import { providerAPI } from "../../utils/api";
import { toast } from "react-toastify";

export default function ProviderProfileModal({ isOpen, onClose, profile, onUpdate }) {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await providerAPI.updateProfile(formData);
      toast.success("Profile updated successfully");
      onUpdate(res.data.data);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8 border-b flex justify-between items-center bg-muted/30">
          <div>
            <h2 className="text-2xl font-black">Edit Service Profile</h2>
            <p className="text-sm text-muted-foreground font-medium">Update your public information</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 max-h-[70vh] overflow-y-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Common Fields */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Business/Professional Name</label>
              <input 
                name="businessName"
                value={formData.businessName || ""}
                onChange={handleChange}
                className="w-full px-5 py-4 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Contact Phone</label>
              <input 
                name="phone"
                value={formData.phone || ""}
                onChange={handleChange}
                className="w-full px-5 py-4 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all font-medium"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Address / Landmark</label>
              <input 
                name="address"
                value={formData.address || ""}
                onChange={handleChange}
                className="w-full px-5 py-4 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">City</label>
              <input 
                name="city"
                value={formData.city || ""}
                onChange={handleChange}
                className="w-full px-5 py-4 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">State</label>
              <input 
                name="state"
                value={formData.state || ""}
                onChange={handleChange}
                className="w-full px-5 py-4 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all font-medium"
              />
            </div>

            {/* Role Specific Fields */}
            {formData.specialization !== undefined && (
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Specialization</label>
                <input 
                  name="specialization"
                  value={formData.specialization || ""}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all font-medium"
                />
              </div>
            )}

            {formData.fees !== undefined && (
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Consultation Fees (₹)</label>
                <input 
                  type="number"
                  name="fees"
                  value={formData.fees || 0}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all font-medium"
                />
              </div>
            )}

            {formData.description !== undefined && (
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Service Description</label>
                <textarea 
                  name="description"
                  rows={3}
                  value={formData.description || ""}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all font-medium resize-none"
                />
              </div>
            )}

            {/* Read-only Information */}
            <div className="md:col-span-2 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex gap-3">
              <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
              <div className="text-xs text-orange-700 font-medium leading-relaxed">
                <p className="font-bold mb-1 uppercase tracking-wider">Verification Security</p>
                Government ID ({formData.licenseNumber}) and verification status are locked. Contact support if you need to update these credentials.
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-muted rounded-2xl font-bold hover:bg-muted/80 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-[2] py-4 bg-[var(--healthcare-cyan)] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-cyan-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
