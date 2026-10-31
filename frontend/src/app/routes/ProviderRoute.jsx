import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProviderRoute — allows access to /join-provider for:
 *   ✅ Non-authenticated visitors
 *   ✅ Logged-in users with role = 'user'
 *
 * Redirects:
 *   🚫 doctor  → /dashboard
 *   🚫 admin   → /dashboard
 *   🚫 ambulance/bloodbank/lab → /dashboard
 */
export default function ProviderRoute() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return null;

  // Already a provider or admin — no access
  if (isAuthenticated && user?.role !== 'user') {
    return <Navigate to="/dashboard" replace />;
  }

  // If user role === 'user' and already applied (pending)
  // This is handled inside JoinAsProvider page itself (shows "Application Pending")

  return <Outlet />;
}
