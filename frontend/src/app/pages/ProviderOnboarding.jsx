import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Upload, 
  CheckCircle2, 
  Loader2, 
  Building2, 
  User, 
  Phone, 
  MapPin, 
  FileText,
  ShieldCheck,
  Stethoscope,
  Ambulance,
  Droplets,
  FlaskConical
} from 'lucide-react';
import { toast } from 'react-toastify';
import { providersAPI } from '../utils/api';

const typeConfigs = {
  doctor: {
    title: 'Medical Professional Onboarding',
    icon: Stethoscope,
    color: 'text-blue-500',
    extraFields: [
      { name: 'specialization', label: 'Specialization', type: 'text', placeholder: 'e.g. Cardiologist' },
      { name: 'fees', label: 'Consultation Fees (₹)', type: 'number', placeholder: '500' },
      { name: 'experience', label: 'Years of Experience', type: 'number', placeholder: '5' },
      { name: 'qualification', label: 'Qualification/Degrees', type: 'text', placeholder: 'MBBS, MD' },
      { name: 'licenseNumber', label: 'Medical License Number', type: 'text', placeholder: 'REG-12345' },
    ]
  },
  ambulance: {
    title: 'Emergency Service Onboarding',
    icon: Ambulance,
    color: 'text-red-500',
    extraFields: [
      { name: 'vehicleCount', label: 'Number of Ambulances', type: 'number', placeholder: '1' },
      { name: 'licenseNumber', label: 'Business License Number', type: 'text', placeholder: 'AMB-12345' },
      { name: 'vehicleTypes', label: 'Vehicle Types (comma separated)', type: 'text', placeholder: 'Basic, ICU, Cardiac' },
    ]
  },
  bloodbank: {
    title: 'Life-Saving Partner Onboarding',
    icon: Droplets,
    color: 'text-rose-500',
    extraFields: [
      { name: 'licenseNumber', label: 'Blood Bank License No.', type: 'text', placeholder: 'BB-12345' },
      { name: 'storageCertification', label: 'Storage Certifications', type: 'text', placeholder: 'ISO, NABL' },
    ]
  },
  lab: {
    title: 'Diagnostic Partner Onboarding',
    icon: FlaskConical,
    color: 'text-emerald-500',
    extraFields: [
      { name: 'testCategories', label: 'Test Categories (comma separated)', type: 'text', placeholder: 'Blood, Imaging, Pathology' },
      { name: 'licenseNumber', label: 'Lab License Number', type: 'text', placeholder: 'LAB-12345' },
    ]
  }
};

export default function ProviderOnboarding() {
  const { type } = useParams();
  const navigate = useNavigate();
  const config = typeConfigs[type] || typeConfigs.doctor;
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    businessName: '',
    description: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    // Dynamic fields will be added here
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await providersAPI.apply({ type, ...formData });
      setSubmitted(true);
      toast.success('Application submitted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Onboarding failed');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 pt-20">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-card border border-border rounded-[40px] p-12 text-center shadow-2xl"
        >
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-500">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black mb-4">Application Received!</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Your application for <span className="font-bold text-foreground">Nirogya Provider Network</span> is under review. Our team will verify your documents and activate your dashboard within 24-48 hours.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-4 bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] text-white rounded-2xl font-bold hover:shadow-xl transition-all"
          >
            Go to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate('/join-provider')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-widest">Back to Categories</span>
        </button>

        <div className="bg-card border border-border rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-6 mb-12">
            <div className={`w-16 h-16 rounded-2xl bg-muted flex items-center justify-center ${config.color}`}>
              <config.icon className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black">{config.title}</h1>
              <p className="text-sm text-muted-foreground">Complete your professional profile for verification</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Step Indicators */}
            <div className="flex gap-2 mb-8">
              <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-[var(--healthcare-cyan)]' : 'bg-muted'}`} />
              <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-[var(--healthcare-cyan)]' : 'bg-muted'}`} />
              <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 3 ? 'bg-[var(--healthcare-cyan)]' : 'bg-muted'}`} />
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[var(--healthcare-cyan)]" /> Basic Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Business/Professional Name</label>
                      <input
                        required
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleInputChange}
                        className="w-full px-5 py-4 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-[var(--healthcare-cyan)] outline-none transition-all"
                        placeholder="e.g. Apollo Diagnostics"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contact Phone</label>
                      <input
                        required
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-5 py-4 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-[var(--healthcare-cyan)] outline-none transition-all"
                        placeholder="+91 00000 00000"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">About / Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-5 py-4 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-[var(--healthcare-cyan)] outline-none transition-all resize-none"
                      placeholder="Tell us about your services..."
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full py-4 bg-accent hover:bg-muted rounded-2xl font-bold transition-all"
                  >
                    Next Step
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[var(--healthcare-cyan)]" /> Professional Details
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {config.extraFields.map((field) => (
                      <div key={field.name} className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{field.label}</label>
                        <input
                          required
                          type={field.type}
                          name={field.name}
                          value={formData[field.name] || ''}
                          onChange={handleInputChange}
                          className="w-full px-5 py-4 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-[var(--healthcare-cyan)] outline-none transition-all"
                          placeholder={field.placeholder}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 py-4 border border-border rounded-2xl font-bold transition-all"
                    >
                      Back
                    </button>
                    <button 
                      type="button"
                      onClick={() => setStep(3)}
                      className="flex-[2] py-4 bg-accent hover:bg-muted rounded-2xl font-bold transition-all"
                    >
                      Next Step
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[var(--healthcare-cyan)]" /> Location & Documents
                  </h3>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Address</label>
                    <input
                      required
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-5 py-4 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-[var(--healthcare-cyan)] outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">City</label>
                      <input
                        required
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-5 py-4 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-[var(--healthcare-cyan)] outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">State</label>
                      <input
                        required
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full px-5 py-4 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-[var(--healthcare-cyan)] outline-none transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="p-8 border-2 border-dashed border-border rounded-[32px] text-center hover:border-[var(--healthcare-cyan)]/50 transition-colors cursor-pointer group">
                    <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4 group-hover:text-[var(--healthcare-cyan)] transition-colors" />
                    <p className="font-bold text-sm">Upload Certification Documents</p>
                    <p className="text-xs text-muted-foreground mt-2">PDF, JPG or PNG (Max 5MB)</p>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setStep(2)}
                      className="flex-1 py-4 border border-border rounded-2xl font-bold transition-all"
                    >
                      Back
                    </button>
                    <button 
                      type="submit"
                      disabled={loading}
                      className="flex-[2] py-4 bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] text-white rounded-2xl font-bold hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete Application'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>
      </div>
    </div>
  );
}
