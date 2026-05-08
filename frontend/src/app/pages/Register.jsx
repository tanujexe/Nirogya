import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Heart, ArrowRight, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });

  const [showPassword, setShowPassword] = useState(false);
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

    if (!agreedToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: 'user', // Always user/patient
      });
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
    <div className="min-h-screen flex items-center justify-center px-4 py-24 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Side: Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:block"
        >
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-[var(--healthcare-cyan)]/10 rounded-full mb-6 border border-[var(--healthcare-cyan)]/20">
            <Heart className="w-4 h-4 text-[var(--healthcare-cyan)]" fill="currentColor" />
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--healthcare-cyan)]">Join our healthcare community</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-none tracking-tight text-slate-900 dark:text-white">
            Start Your Journey to <br />
            <span className="bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] bg-clip-text text-transparent">
              Better Health
            </span>
          </h1>

          <div className="space-y-8 max-w-md">
            <div className="flex items-start space-x-6">
              <div className="shrink-0 p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-[var(--healthcare-cyan)]/10 border border-slate-100 dark:border-white/5">
                <Shield className="w-6 h-6 text-[var(--healthcare-cyan)]" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">Secure Medical Vault</p>
                <p className="text-sm text-slate-500 font-medium">Your health records are encrypted and private, accessible only by you.</p>
              </div>
            </div>
            <div className="flex items-start space-x-6">
              <div className="shrink-0 p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-[var(--healthcare-cyan)]/10 border border-slate-100 dark:border-white/5">
                <Activity className="w-6 h-6 text-[var(--healthcare-blue)]" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">Direct Provider Access</p>
                <p className="text-sm text-slate-500 font-medium">Connect with Gwalior's best doctors and emergency services instantly.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--healthcare-cyan)]/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          
          <div className="relative">
            <h2 className="text-4xl font-bold mb-2 tracking-tight text-slate-900 dark:text-white">Create Account</h2>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mb-10">Patient Registration</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[var(--healthcare-cyan)] transition-colors" />
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[var(--healthcare-cyan)] outline-none transition-all dark:text-white"
                  />
                </div>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[var(--healthcare-cyan)] transition-colors" />
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[var(--healthcare-cyan)] outline-none transition-all dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[var(--healthcare-cyan)] transition-colors" />
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[var(--healthcare-cyan)] outline-none transition-all dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[var(--healthcare-cyan)]"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[var(--healthcare-cyan)] transition-colors" />
                  <input
                    name="confirmPassword"
                    type="password"
                    required
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[var(--healthcare-cyan)] outline-none transition-all dark:text-white"
                  />
                </div>
              </div>

              <label className="flex items-center space-x-4 cursor-pointer group p-2">
                <input
                  type="checkbox"
                  required
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-6 h-6 rounded-lg border-slate-300 text-[var(--healthcare-cyan)] focus:ring-[var(--healthcare-cyan)] transition-all"
                />
                <span className="text-sm font-bold text-slate-500 group-hover:text-[var(--healthcare-cyan)] transition-colors">
                  I agree to the <Link to="/terms" className="text-[var(--healthcare-cyan)] underline">Terms</Link> and <Link to="/privacy" className="text-[var(--healthcare-cyan)] underline">Privacy Policy</Link>
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] text-white font-bold text-lg shadow-xl shadow-[var(--healthcare-cyan)]/20 hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center space-x-3 uppercase tracking-widest"
              >
                {loading ? (
                  <span className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Patient Account</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center mt-10 text-slate-500 font-bold">
              Already have an account?{' '}
              <Link to="/login" className="text-[var(--healthcare-cyan)] font-bold hover:underline uppercase tracking-tight">
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