import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import DoctorProfileSettings from './DoctorProfileSettings';
import PatientProfileSettings from './PatientProfileSettings';
import ProviderProfileSettings from './ProviderProfileSettings';

export default function Profile() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  if (user.role === 'doctor') {
    return <DoctorProfileSettings />;
  }

  if (['ambulance', 'bloodbank', 'lab'].includes(user.role)) {
    return <ProviderProfileSettings />;
  }

  return <PatientProfileSettings />;
}
