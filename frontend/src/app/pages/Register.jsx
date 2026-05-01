import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState('user');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

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

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (!agreedToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    try {
      await register(formData.name, formData.email, formData.password, role);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">

      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-8 items-center">

        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:block"
        >
          <h2 className="text-3xl font-bold mb-4">
            Join Nirogya Sathi
          </h2>

          <p className="text-muted-foreground text-lg">
            Create your account and access healthcare easily.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-card border border-border rounded-3xl p-8 md:p-12 shadow-2xl"
        >

          <div className="flex items-center space-x-3 mb-8">
            <div className="bg-gradient-to-br from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] p-3 rounded-xl">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Create Account</h1>
          </div>

          {/* Role */}
          <div className="flex bg-muted rounded-xl p-1 mb-8">
            <button
              type="button"
              onClick={() => setRole('user')}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                role === 'user'
                  ? 'bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] text-white shadow-md'
                  : 'text-muted-foreground'
              }`}
            >
              Patient
            </button>

            <button
              type="button"
              onClick={() => setRole('doctor')}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                role === 'doctor'
                  ? 'bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] text-white shadow-md'
                  : 'text-muted-foreground'
              }`}
            >
              Doctor
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            <input
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-3 border rounded-xl"
            />

            <input
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 border rounded-xl"
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 border rounded-xl"
            />

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full p-3 border rounded-xl"
            />

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
              />
              <span className="text-sm">
                I agree to Terms & Privacy Policy
              </span>
            </label>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] text-white rounded-xl"
            >
              Create Account
            </button>

          </form>

          <p className="text-center mt-6 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-[var(--healthcare-cyan)]">
              Sign in
            </Link>
          </p>

        </motion.div>
      </div>
    </div>
  );
}