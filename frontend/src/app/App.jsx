import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/globals.css';
import { motion, AnimatePresence } from 'motion/react';

import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProviderRoute from './routes/ProviderRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Doctors from './pages/Doctors';
import DoctorProfile from './pages/DoctorProfile';
import Dashboard from './pages/Dashboard';
import Hospitals from './pages/Hospitals';
import LabTests from './pages/LabTests';
import SymptomCheckerPage from './pages/SymptomCheckerPage';
import BloodBank from './pages/BloodBank';
import Profile from './pages/Profile';
import MedicalVault from './pages/MedicalVault';
import JoinAsProvider from './pages/JoinAsProvider';
import ProviderOnboarding from './pages/ProviderOnboarding';
import ProviderProfile from './pages/ProviderProfile';
import AmbulanceBooking from './pages/user/AmbulanceBooking';
import LiveTracking from './pages/user/LiveTracking';
import DriverDashboard from './pages/driver/DriverDashboard';
import PatientProfileSettings from './pages/PatientProfileSettings';
import DoctorProfileSettings from './pages/DoctorProfileSettings';
import NotFound from './pages/NotFound';
import Loader from './components/common/Loader';
import EmergencyFloat from './components/common/EmergencyFloat';

function ProtectedRoute({ children, roles = [] }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}

function AppRoutes() {
  const { loading } = useAuth();
  const location = useLocation();
  const { pathname } = location;

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      <ScrollToTop />
      <Navbar />

      <main className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <Routes location={location} key={pathname}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/doctors" element={<Doctors />} />
              <Route path="/doctor/:id" element={<DoctorProfile />} />
              <Route path="/hospitals" element={<Hospitals />} />
              <Route path="/lab-tests" element={<LabTests />} />
              <Route path="/blood-bank" element={<BloodBank />} />
              <Route path="/ambulance" element={<ProtectedRoute><AmbulanceBooking /></ProtectedRoute>} />
              <Route path="/ambulance/track/:bookingId" element={<ProtectedRoute><LiveTracking /></ProtectedRoute>} />
              <Route path="/ambulance/driver/dashboard" element={<ProtectedRoute roles={['ambulance']}><DriverDashboard /></ProtectedRoute>} />
              <Route path="/symptom-checker" element={<SymptomCheckerPage />} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/vault" element={<ProtectedRoute><MedicalVault /></ProtectedRoute>} />

              {/* Provider flow — public + 'user' only; blocks doctor/admin */}
              <Route element={<ProviderRoute />}>
                <Route path="/join-provider" element={<JoinAsProvider />} />
                <Route path="/onboarding/:type" element={<ProviderOnboarding />} />
              </Route>

              <Route path="/provider/:type/:id" element={<ProviderProfile />} />

              {/* Settings */}
              <Route path="/settings" element={<ProtectedRoute roles={['user']}><PatientProfileSettings /></ProtectedRoute>} />
              <Route path="/doctor/settings" element={<ProtectedRoute roles={['doctor']}><DoctorProfileSettings /></ProtectedRoute>} />

              {/* Unified Dashboard with Role Handling Inside */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* Explicit Admin Routes (Example) */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute roles={['admin']}>
                    <Navigate to="/dashboard" replace />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />
      <EmergencyFloat />

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastClassName="!bg-card !text-foreground !border !border-border !rounded-xl"
        progressClassName="!bg-gradient-to-r !from-[var(--healthcare-cyan)] !to-[var(--healthcare-blue)]"
      />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}