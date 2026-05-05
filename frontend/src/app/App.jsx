import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/globals.css';

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
import Ambulance from './pages/Ambulance';
import Profile from './pages/Profile';
import MedicalVault from './pages/MedicalVault';
import JoinAsProvider from './pages/JoinAsProvider';
import ProviderOnboarding from './pages/ProviderOnboarding';
import ProviderProfile from './pages/ProviderProfile';
import PatientProfileSettings from './pages/PatientProfileSettings';
import DoctorProfileSettings from './pages/DoctorProfileSettings';
import NotFound from './pages/NotFound';

function ProtectedRoute({ children, roles = [] }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-12 h-12 border-4 border-[var(--healthcare-cyan)] border-t-transparent rounded-full shadow-lg" />
          <p className="text-muted-foreground animate-pulse font-medium">Securing your session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function ScrollToHash() {
  const { hash } = useLocation();
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
  }, [hash]);
  return null;
}

function AppRoutes() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      <ScrollToHash />
      <Navbar />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/doctor/:id" element={<DoctorProfile />} />
          <Route path="/hospitals" element={<Hospitals />} />
          <Route path="/lab-tests" element={<LabTests />} />
          <Route path="/blood-bank" element={<BloodBank />} />
          <Route path="/ambulance" element={<Ambulance />} />
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
      </main>

      <Footer />

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