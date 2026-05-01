import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import DoctorProfileSettings from './DoctorProfileSettings';
import PatientProfileSettings from './PatientProfileSettings'; // I'll create this next

export default function Profile() {
  const { user } = useAuth();

  if (user?.role === 'doctor') {
    return <DoctorProfileSettings />;
  }

  return <PatientProfileSettings />;
}
