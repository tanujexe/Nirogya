import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Heart, Stethoscope, Award, IndianRupee, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    // Doctor specific fields
    specialization: '',
    experience: '',
    fees: '',
    licenseNumber: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('user');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all basic fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (role === 'doctor') {
      if (!formData.specialization || !formData.experience || !formData.fees || !formData.licenseNumber) {
        toast.error('Please fill in all doctor specialization details');
        return;
      }
    }

    if (!agreedToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    setLoading(true);
    try {
      // Prepare registration data
      const registrationData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: role,
      };

      // Add doctor specific fields if needed
      if (role === 'doctor') {
        registrationData.specialization = formData.specialization;
        registrationData.experience = Number(formData.experience);
        registrationData.fees = Number(formData.fees);
        registrationData.licenseNumber = formData.licenseNumber;
      }

      await register(registrationData);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-24 bg-muted/5">
      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Side: Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:block"
        >
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-[var(--healthcare-cyan)]/10 rounded-full mb-6">
            <Heart className="w-4 h-4 text-[var(--healthcare-cyan)]" />
            <span className="text-sm font-medium text-[var(--healthcare-cyan)]">Join our healthcare community</span>
          </div>
          
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Start Your Journey to <br />
            <span className="bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] bg-clip-text text-transparent">
              Better Health
            </span>
          </h1>

          <div className="space-y-6 text-muted-foreground text-lg">
            <div className="flex items-start space-x-4">
              <div className="mt-1 p-2 bg-white rounded-lg shadow-sm">
                <Shield className="w-5 h-5 text-[var(--healthcare-cyan)]" />
              </div>
              <p>Secure and private health records management.</p>
            </div>
            <div className="flex items-start space-x-4">
              <div className="mt-1 p-2 bg-white rounded-lg shadow-sm">
                <Stethoscope className="w-5 h-5 text-[var(--healthcare-blue)]" />
              </div>
              <p>Connect with verified medical professionals instantly.</p>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--healthcare-cyan)]/10 to-transparent rounded-bl-full" />
          
          <div className="relative">
            <h2 className="text-3xl font-bold mb-2">Create Account</h2>
            <p className="text-muted-foreground mb-8">Fill in your details to get started.</p>

            {/* Role Switcher */}
            <div className="flex bg-muted/50 rounded-2xl p-1.5 mb-8 border border-border/50">
              {['user', 'doctor'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all capitalize ${
                    role === r
                      ? 'bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] text-white shadow-xl'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {r === 'user' ? 'Patient' : 'Doctor'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Common Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-[var(--healthcare-cyan)] transition-colors" />
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-muted/30 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--healthcare-cyan)] transition-all"
                  />
                </div>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-[var(--healthcare-cyan)] transition-colors" />
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-muted/30 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--healthcare-cyan)] transition-all"
                  />
                </div>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-[var(--healthcare-cyan)] transition-colors" />
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-12 pr-12 py-3.5 bg-muted/30 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--healthcare-cyan)] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-[var(--healthcare-cyan)] transition-colors" />
                  <input
                    name="confirmPassword"
                    type="password"
                    required
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-muted/30 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--healthcare-cyan)] transition-all"
                  />
                </div>
              </div>

              {/* Doctor Specific Fields */}
              <AnimatePresence>
                {role === 'doctor' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-2"
                  >
                    <div className="p-4 bg-[var(--healthcare-cyan)]/5 rounded-2xl border border-[var(--healthcare-cyan)]/10">
                      <p className="text-xs font-bold text-[var(--healthcare-cyan)] uppercase tracking-widest mb-4">Professional Details</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative group">
                          <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-[var(--healthcare-cyan)] transition-colors" />
                          <input
                            name="specialization"
                            required={role === 'doctor'}
                            placeholder="Specialization (e.g. Cardiologist)"
                            value={formData.specialization}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--healthcare-cyan)] text-sm"
                          />
                        </div>
                        <div className="relative group">
                          <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-[var(--healthcare-cyan)] transition-colors" />
                          <input
                            name="experience"
                            type="number"
                            required={role === 'doctor'}
                            placeholder="Years of Experience"
                            value={formData.experience}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--healthcare-cyan)] text-sm"
                          />
                        </div>
                        <div className="relative group">
                          <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-[var(--healthcare-cyan)] transition-colors" />
                          <input
                            name="fees"
                            type="number"
                            required={role === 'doctor'}
                            placeholder="Consultation Fees (₹)"
                            value={formData.fees}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--healthcare-cyan)] text-sm"
                          />
                        </div>
                        <div className="relative group">
                          <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-[var(--healthcare-cyan)] transition-colors" />
                          <input
                            name="licenseNumber"
                            required={role === 'doctor'}
                            placeholder="Medical License Number"
                            value={formData.licenseNumber}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--healthcare-cyan)] text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Terms */}
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  required
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-5 h-5 rounded-lg border-border text-[var(--healthcare-cyan)] focus:ring-[var(--healthcare-cyan)]"
                />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  I agree to the <Link to="/terms" className="text-[var(--healthcare-cyan)] font-semibold">Terms</Link> and <Link to="/privacy" className="text-[var(--healthcare-cyan)] font-semibold">Privacy Policy</Link>
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] text-white font-bold text-lg shadow-lg shadow-[var(--healthcare-cyan)]/30 hover:shadow-xl hover:shadow-[var(--healthcare-cyan)]/40 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Create {role === 'user' ? 'Patient' : 'Doctor'} Account</span>
                )}
              </button>
            </form>

            <p className="text-center mt-8 text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-[var(--healthcare-cyan)] font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Helper icons
function Shield(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  );
}