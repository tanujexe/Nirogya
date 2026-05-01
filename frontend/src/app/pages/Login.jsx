import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [role, setRole] = useState('user');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await login(email, password, role);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Login failed. Please try again.');
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
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] rounded-3xl blur-3xl opacity-20" />
            <img
              src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80"
              alt="Healthcare"
              className="relative rounded-3xl shadow-2xl"
            />
          </div>

          <div className="mt-8">
            <h2 className="text-3xl font-bold mb-4">Welcome Back!</h2>
            <p className="text-muted-foreground text-lg">
              Access your dashboard and manage your healthcare easily.
            </p>
          </div>
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
            <div>
              <h1 className="text-3xl font-bold">Sign In</h1>
              <p className="text-sm text-muted-foreground">
                to Nirogya Sathi Healthcare
              </p>
            </div>
          </div>

          {/* Role Switch */}
          <div className="flex bg-muted rounded-xl p-1 mb-8">
            {['user', 'doctor', 'admin'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2.5 rounded-lg font-medium transition-all capitalize ${
                  role === r
                    ? 'bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] text-white shadow-lg'
                    : 'text-muted-foreground hover:bg-white/10'
                }`}
              >
                {r === 'user' ? 'Patient' : r}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            <div>
              <label className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-input-background border border-border rounded-xl"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Password
              </label>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />

                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 bg-input-background border border-border rounded-xl"
                  placeholder="••••••••"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] text-white font-medium"
            >
              Sign In
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-[var(--healthcare-cyan)]">
                Sign up
              </Link>
            </p>
          </div>

        </motion.div>
      </div>
    </div>
  );
}