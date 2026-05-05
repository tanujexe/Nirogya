import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  Star,
  Award,
  Calendar,
  Clock,
  GraduationCap,
  Building2,
  CheckCircle,
} from "lucide-react";

import { doctorsAPI } from "../utils/api";
import GeneralBookingForm from "../components/common/GeneralBookingForm";

export default function DoctorProfile() {
  const { id } = useParams();
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        setLoading(true);
        const res = await doctorsAPI.getById(id);
        setDoctor(res.data.data);
      } catch (err) {
        console.error("Error fetching doctor details:", err);
        setError("Could not find the doctor profile. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/5">
        <div className="w-16 h-16 border-4 border-[var(--healthcare-cyan)]/20 rounded-full animate-ping mb-4" />
        <p className="text-muted-foreground animate-pulse font-medium">Loading profile...</p>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 flex items-center justify-center bg-muted/5">
        <div className="text-center p-12 bg-card border border-dashed rounded-3xl max-w-md">
          <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-20" />
          <h2 className="text-2xl font-bold mb-2">Doctor not found</h2>
          <p className="text-muted-foreground mb-8">
            {error || "The doctor you're looking for doesn't exist or may have moved."}
          </p>
          <Link to="/doctors" className="px-6 py-3 bg-[var(--healthcare-cyan)] text-white rounded-xl font-bold shadow-lg shadow-cyan-500/20 active:scale-95 transition-all">
            Back to Doctors
          </Link>
        </div>
      </div>
    );
  }

  const doctorName = doctor.userId?.name || doctor.name || "Doctor";
  const doctorAvatar = doctor.userId?.avatar || doctor.profileImage || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&q=80";

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-muted/5">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xl shadow-cyan-500/5"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-br from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] p-8 md:p-12 overflow-hidden">
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

            <div className="relative flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
              <div className="relative group">
                <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                <img
                  src={doctorAvatar}
                  alt={doctorName}
                  className="relative w-32 h-32 md:w-48 md:h-48 rounded-2xl object-cover border-4 border-white shadow-2xl"
                />
                <div className="absolute -bottom-2 -right-2 bg-white p-2.5 rounded-xl shadow-lg ring-4 ring-[var(--healthcare-cyan)]/10">
                  <CheckCircle
                    className="w-6 h-6 text-[var(--healthcare-green)]"
                    fill="currentColor"
                  />
                </div>
              </div>

              <div className="flex-1 text-white">
                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                  <h1 className="text-3xl md:text-4xl font-black">
                    {doctorName}
                  </h1>
                  <span className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
                    Verified Pro
                  </span>
                </div>

                <p className="text-xl md:text-2xl font-medium opacity-90 mb-4">
                  {doctor.specialization}
                </p>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-8 mb-8 text-sm md:text-base font-medium">
                  <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                    <Clock className="w-5 h-5 text-cyan-200" />
                    {doctor.experience}+ Years Exp.
                  </span>

                  <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                    <Star className="w-5 h-5 text-yellow-300" fill="currentColor" />
                    {doctor.rating || "New"} Rating
                  </span>
                </div>

                <button
                  onClick={() => setShowBookingForm(true)}
                  className="px-8 py-4 bg-white text-[var(--healthcare-cyan)] rounded-2xl font-black shadow-xl shadow-black/10 hover:scale-105 active:scale-95 transition-all"
                >
                  Book Instant Appointment
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="grid lg:grid-cols-3 gap-8 p-8 md:p-12">
            <div className="lg:col-span-2 space-y-12">
              <section>
                <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                  <div className="w-1 h-8 bg-[var(--healthcare-cyan)] rounded-full" />
                  Professional Profile
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed italic">
                  {doctor.about || `Dr. ${doctorName} is a highly skilled professional specialized in ${doctor.specialization} with over ${doctor.experience} years of clinical experience.`}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                  <div className="w-1 h-8 bg-[var(--healthcare-cyan)] rounded-full" />
                  Education & Expertise
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-6 bg-muted/30 border border-border rounded-2xl flex gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <GraduationCap className="w-6 h-6 text-[var(--healthcare-cyan)]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Qualification</p>
                      <p className="font-bold text-foreground">{doctor.qualification || "MD, MBBS"}</p>
                    </div>
                  </div>

                  <div className="p-6 bg-muted/30 border border-border rounded-2xl flex gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <Award className="w-6 h-6 text-[var(--healthcare-cyan)]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Specialization</p>
                      <p className="font-bold text-foreground">{doctor.specialization}</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Sidebar / Quick Info */}
            <div className="space-y-6">
              <div className="p-8 bg-muted/30 border border-border rounded-3xl">
                <h3 className="text-xl font-bold mb-6">Booking Details</h3>
                
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Consultation Fee</span>
                    <span className="text-2xl font-black text-[var(--healthcare-cyan)]">₹{doctor.fees}</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground bg-white border border-border p-4 rounded-2xl">
                    <Calendar className="w-5 h-5 text-[var(--healthcare-green)]" />
                    Available: Mon - Sat
                  </div>

                  <button 
                    onClick={() => setShowBookingForm(true)}
                    className="w-full py-4 bg-[var(--healthcare-cyan)] text-white rounded-2xl font-bold shadow-lg shadow-cyan-500/20 hover:opacity-90 transition-all"
                  >
                    Select Time Slot
                  </button>
                </div>
              </div>

              <div className="p-8 bg-gradient-to-br from-cyan-900 to-blue-900 rounded-3xl text-white shadow-xl">
                <h3 className="text-lg font-bold mb-4">Patient Support</h3>
                <p className="text-sm opacity-70 mb-6">Need help with booking? Our team is available 24/7 to assist you.</p>
                <button className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-bold transition-all">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {showBookingForm && (
          <GeneralBookingForm
            provider={doctor}
            type="doctor"
            onClose={() => setShowBookingForm(false)}
          />
        )}
      </div>
    </div>
  );
}