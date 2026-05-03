import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, X, Moon, Sun, User, LogOut, LayoutDashboard, Heart, 
  ChevronDown, Settings, Shield, Activity, Droplet, Navigation, Stethoscope, ShieldCheck, UserPlus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showServices, setShowServices] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef(null);
  const servicesRef = useRef(null);

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (servicesRef.current && !servicesRef.current.contains(event.target)) {
        setShowServices(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsOpen(false);
    setShowUserMenu(false);
    setShowServices(false);
  }, [location.pathname]);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', !isDark ? 'dark' : 'light');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const services = [
    { name: 'Blood Bank', path: '/blood-bank', icon: Droplet, color: 'text-red-500' },
    { name: 'Ambulances', path: '/ambulance', icon: Navigation, color: 'text-orange-500' },
    { name: 'Lab Tests', path: '/lab-tests', icon: Activity, color: 'text-blue-500' },
    { name: 'Symptom Checker', path: '/symptom-checker', icon: Stethoscope, color: 'text-cyan-500' },
    { name: 'Medical Vault', path: '/vault', icon: ShieldCheck, color: 'text-purple-500' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-background/70 backdrop-blur-xl shadow-lg border-b border-border/50 py-2'
          : 'bg-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="relative">
              <div className="absolute inset-0 bg-[var(--healthcare-cyan)] blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative bg-gradient-to-br from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] p-2.5 rounded-2xl shadow-lg group-hover:scale-105 transition-transform duration-300">
                <Heart className="w-5 h-5 text-white" fill="currentColor" />
              </div>
            </div>
            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] bg-clip-text text-transparent">
              NirogyaSathi
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center space-x-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                location.pathname === '/' ? 'text-[var(--healthcare-cyan)] bg-[var(--healthcare-cyan)]/5' : 'text-foreground/70 hover:text-foreground hover:bg-accent'
              }`}
            >
              Home
            </Link>
            <Link
              to="/doctors"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                location.pathname === '/doctors' ? 'text-[var(--healthcare-cyan)] bg-[var(--healthcare-cyan)]/5' : 'text-foreground/70 hover:text-foreground hover:bg-accent'
              }`}
            >
              Doctors
            </Link>
            <Link
              to="/hospitals"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                location.pathname === '/hospitals' ? 'text-[var(--healthcare-cyan)] bg-[var(--healthcare-cyan)]/5' : 'text-foreground/70 hover:text-foreground hover:bg-accent'
              }`}
            >
              Hospitals
            </Link>

            {/* Services Dropdown */}
            <div className="relative" ref={servicesRef}>
              <button
                onClick={() => setShowServices(!showServices)}
                className={`flex items-center space-x-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  showServices ? 'text-[var(--healthcare-cyan)] bg-[var(--healthcare-cyan)]/5' : 'text-foreground/70 hover:text-foreground hover:bg-accent'
                }`}
              >
                <span>Services</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showServices ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showServices && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 mt-2 w-64 bg-card border border-border/50 rounded-2xl shadow-2xl backdrop-blur-xl p-2 overflow-hidden"
                  >
                    <div className="grid gap-1">
                      {services.map((service) => (
                        <Link
                          key={service.path}
                          to={service.path}
                          className="flex items-center space-x-3 p-3 rounded-xl hover:bg-accent transition-all group"
                        >
                          <div className={`p-2 rounded-lg bg-muted group-hover:bg-background transition-colors`}>
                            <service.icon className={`w-4 h-4 ${service.color}`} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{service.name}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link
              to="/join-provider"
              className="ml-4 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-[var(--healthcare-cyan)]/10 text-[var(--healthcare-cyan)] hover:bg-[var(--healthcare-cyan)] hover:text-white transition-all shadow-sm flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> Join as Provider
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl hover:bg-accent transition-all text-foreground/70 hover:text-foreground"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 pl-2 pr-1 py-1 rounded-2xl border border-border hover:border-[var(--healthcare-cyan)]/50 hover:bg-accent/50 transition-all group"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] flex items-center justify-center text-white text-sm font-bold shadow-md group-hover:scale-105 transition-transform">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full right-0 mt-2 w-64 bg-card border border-border/50 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden"
                    >
                      <div className="p-4 border-b border-border/50 bg-muted/30">
                        <p className="text-sm font-bold truncate">{user?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--healthcare-cyan)]/10 text-[var(--healthcare-cyan)] text-[10px] font-bold uppercase tracking-wider">
                          {user?.role}
                        </div>
                      </div>

                      <div className="p-2">
                        <Link
                          to="/dashboard"
                          className="flex items-center space-x-3 p-3 rounded-xl hover:bg-accent transition-all group"
                        >
                          <LayoutDashboard className="w-4 h-4 text-muted-foreground group-hover:text-[var(--healthcare-cyan)]" />
                          <span className="text-sm font-medium">Dashboard</span>
                        </Link>
                        {user?.role === 'user' && (
                          <Link
                            to="/vault"
                            className="flex items-center space-x-3 p-3 rounded-xl hover:bg-accent transition-all group"
                          >
                            <ShieldCheck className="w-4 h-4 text-muted-foreground group-hover:text-purple-500" />
                            <span className="text-sm font-medium">Medical Vault</span>
                          </Link>
                        )}
                        <Link
                          to="/profile"
                          className="flex items-center space-x-3 p-3 rounded-xl hover:bg-accent transition-all group"
                        >
                          <User className="w-4 h-4 text-muted-foreground group-hover:text-[var(--healthcare-cyan)]" />
                          <span className="text-sm font-medium">My Profile</span>
                        </Link>
                        <Link
                          to="/settings"
                          className="flex items-center space-x-3 p-3 rounded-xl hover:bg-accent transition-all group"
                        >
                          <Settings className="w-4 h-4 text-muted-foreground group-hover:text-[var(--healthcare-cyan)]" />
                          <span className="text-sm font-medium">Settings</span>
                        </Link>
                      </div>

                      <div className="p-2 border-t border-border/50">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-destructive/10 text-destructive transition-all group"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm font-medium">Logout</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-accent transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] text-white shadow-lg shadow-[var(--healthcare-cyan)]/20 hover:shadow-xl hover:shadow-[var(--healthcare-cyan)]/30 transition-all active:scale-95"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2.5 rounded-xl hover:bg-accent transition-all text-foreground/70 hover:text-foreground"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background/95 backdrop-blur-2xl border-t border-border/50 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Link to="/" className="p-4 rounded-2xl bg-accent/50 flex flex-col items-center justify-center space-y-2">
                  <Heart className="w-5 h-5 text-[var(--healthcare-cyan)]" />
                  <span className="text-xs font-bold">Home</span>
                </Link>
                <Link to="/doctors" className="p-4 rounded-2xl bg-accent/50 flex flex-col items-center justify-center space-y-2">
                  <Stethoscope className="w-5 h-5 text-[var(--healthcare-blue)]" />
                  <span className="text-xs font-bold">Doctors</span>
                </Link>
                <Link to="/hospitals" className="p-4 rounded-2xl bg-accent/50 flex flex-col items-center justify-center space-y-2">
                  <Activity className="w-5 h-5 text-green-500" />
                  <span className="text-xs font-bold">Hospitals</span>
                </Link>
                <Link to="/lab-tests" className="p-4 rounded-2xl bg-accent/50 flex flex-col items-center justify-center space-y-2">
                  <Shield className="w-5 h-5 text-purple-500" />
                  <span className="text-xs font-bold">Lab Tests</span>
                </Link>
              </div>

              <div className="pt-4 border-t border-border/50">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Quick Links</p>
                <div className="space-y-1">
                  {services.map(service => (
                    <Link
                      key={service.path}
                      to={service.path}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <service.icon className={`w-4 h-4 ${service.color}`} />
                        <span className="text-sm font-medium">{service.name}</span>
                      </div>
                      <ChevronDown className="w-4 h-4 -rotate-90 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </div>

              {!isAuthenticated && (
                <div className="pt-4 grid grid-cols-2 gap-3">
                  <Link to="/login" className="w-full py-3.5 rounded-2xl border border-border font-bold text-sm text-center">Login</Link>
                  <Link to="/register" className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] text-white font-bold text-sm text-center">Sign Up</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}