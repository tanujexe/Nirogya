import { motion } from "motion/react";
import { Bell } from "lucide-react";
import { useAuth } from "../context/AuthContext";

import PatientDashboard from "../components/dashboard/PatientDashboard";
import DoctorDashboard from "../components/dashboard/DoctorDashboard";
import AdminDashboard from "../components/dashboard/AdminDashboard";
import AmbulanceDashboard from "../components/dashboard/AmbulanceDashboard";
import BloodBankDashboard from "../components/dashboard/BloodBankDashboard";
import LabDashboard from "../components/dashboard/LabDashboard";

export default function Dashboard() {
  const { user } = useAuth();

  const renderDashboardContent = () => {
    switch (user?.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'doctor':
        return <DoctorDashboard />;
      case 'ambulance':
        return <AmbulanceDashboard />;
      case 'bloodbank':
        return <BloodBankDashboard />;
      case 'lab':
        return <LabDashboard />;
      case 'user':
      default:
        return <PatientDashboard />;
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-muted/10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold">
              Welcome back,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                {user?.name || "User"}
              </span>
            </h1>
            <p className="text-muted-foreground mt-2">
              {user?.role === 'admin' && 'Manage your platform operations and users.'}
              {user?.role === 'doctor' && 'Manage your appointments and patients.'}
              {user?.role === 'user' && "Here's your health summary for today."}
            </p>
          </motion.div>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-xl shadow-sm hover:bg-muted transition-colors">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium text-sm">Notifications</span>
          </button>
        </div>

        {/* Dynamic Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {renderDashboardContent()}
        </motion.div>

      </div>
    </div>
  );
}