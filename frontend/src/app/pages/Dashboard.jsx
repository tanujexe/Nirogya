import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { toast } from "react-toastify";
import {
  Calendar,
  FileText,
  Activity,
  Bell,
  Heart,
  TrendingUp,
  Clock,
  CheckCircle,
  Pill,
} from "lucide-react";

import { bookingsAPI, adminAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import HealthRecordUpload from "../components/dashboard/HealthRecordUpload";
import RecordsList from "../components/dashboard/RecordsList";

export default function Dashboard() {
  const { user } = useAuth();
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(
    user?.role === "admin" ? "appointments" : "overview"
  );

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (user.role === "admin") {
          const [usersRes, doctorsRes, bookingsRes] = await Promise.all([
            adminAPI.getAllUsers(),
            adminAPI.getAllDoctors(),
            adminAPI.getAllBookings(),
          ]);

          setAllUsers(usersRes.data.data);
          setAllDoctors(doctorsRes.data.data);

          setUpcomingAppointments(
            bookingsRes.data.data.map((b) => ({
              id: b._id,
              personName: b.user?.name || "Unknown",
              doctorName: b.doctor?.name || "Unknown",
              specialization: b.doctor?.specialization,
              date: b.appointmentDate,
              time: b.timeSlot,
              type: "In-Person",
              status: b.status.toLowerCase(),
            }))
          );
        } else {
          const bookingsRes = await bookingsAPI.getUpcoming();

          setUpcomingAppointments(
            bookingsRes.data.data.map((b) => ({
              id: b._id,
              personName:
                user.role === "doctor" ? b.user?.name : b.doctor?.name,
              specialization:
                user.role === "doctor"
                  ? "Patient"
                  : b.doctor?.specialization,
              date: b.appointmentDate,
              time: b.timeSlot,
              type: "In-Person",
              status: b.status.toLowerCase(),
            }))
          );
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchDashboardData();
  }, [user]);

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await bookingsAPI.updateStatus(bookingId, newStatus);
      toast.success(`Appointment ${newStatus}`);

      setUpcomingAppointments((prev) =>
        prev.map((apt) =>
          apt.id === bookingId ? { ...apt, status: newStatus } : apt
        )
      );
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold">
            Welcome back,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              {user?.name}
            </span>
          </h1>
          <p className="text-muted-foreground">
            Here's your health summary for today
          </p>
        </motion.div>

        {/* MAIN WRAPPER FIX (IMPORTANT) */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* LEFT SECTION */}
          <div className="lg:col-span-2 space-y-8">

            {/* APPOINTMENTS */}
            <div>
              <h2 className="text-2xl font-bold mb-6">
                Upcoming Appointments
              </h2>

              <div className="space-y-4">
                {loading ? (
                  <p>Loading...</p>
                ) : upcomingAppointments.length === 0 ? (
                  <p className="text-muted-foreground">
                    No upcoming appointments
                  </p>
                ) : (
                  upcomingAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="bg-card border border-border rounded-2xl p-6"
                    >
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-semibold">
                            {appointment.personName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {appointment.specialization}
                          </p>
                          <p className="text-xs mt-1">
                            {new Date(
                              appointment.date
                            ).toLocaleDateString()}{" "}
                            at {appointment.time}
                          </p>
                        </div>

                        <span className="text-xs px-3 py-1 rounded-full bg-gray-200">
                          {appointment.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* FIXED: WRAPPER ADDED HERE */}
            <div className="space-y-6">
              <HealthRecordUpload />
              <RecordsList />
            </div>

          </div>

          {/* RIGHT SIDE (you can keep your original notifications etc) */}
          <div className="space-y-6">
            <div className="bg-card border rounded-2xl p-6">
              <h2 className="font-bold mb-4">Notifications</h2>
              <p className="text-sm text-muted-foreground">
                Your notifications here...
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}