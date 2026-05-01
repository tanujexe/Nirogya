import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
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
import BookingForm from "../components/doctors/BookingForm";

export default function DoctorProfile() {
  const { id } = useParams();
  const [showBookingForm, setShowBookingForm] = useState(false);

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await doctorsAPI.getById(id);
        setDoctor(res.data.data);
      } catch (error) {
        console.error("Error fetching doctor details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!doctor) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Doctor not found</h2>
          <p className="text-muted-foreground">
            The doctor you're looking for doesn't exist
          </p>
        </div>
      </div>
    );
  }

  const reviews = [
    {
      id: "1",
      name: "Priya Sharma",
      rating: 5,
      date: "2026-04-20",
      text: "Excellent doctor! Very professional and caring.",
    },
    {
      id: "2",
      name: "Rahul Mehta",
      rating: 5,
      date: "2026-04-15",
      text: "Highly recommend! Great consultation experience.",
    },
    {
      id: "3",
      name: "Anita Kumar",
      rating: 4,
      date: "2026-04-10",
      text: "Good experience overall. Very knowledgeable.",
    },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-3xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] p-8 md:p-12">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="relative">
                <img
                  src={doctor.profileImage || "https://via.placeholder.com/150"}
                  alt={doctor.name}
                  className="w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover border-4 border-white shadow-2xl"
                />
                <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-lg">
                  <CheckCircle
                    className="w-6 h-6 text-[var(--healthcare-green)]"
                    fill="currentColor"
                  />
                </div>
              </div>

              <div className="flex-1 text-white">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  {doctor.name}
                </h1>

                <p className="text-xl opacity-90 mb-3">
                  {doctor.specialization}
                </p>

                <div className="flex items-center gap-4 text-sm mb-6">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {doctor.experience}+ years
                  </span>

                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4" fill="currentColor" />
                    {doctor.rating}
                  </span>
                </div>

                <button
                  onClick={() => setShowBookingForm(true)}
                  className="px-6 py-3 bg-white text-[var(--healthcare-cyan)] rounded-xl font-medium"
                >
                  Book Appointment
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 md:p-12">
            <h2 className="text-2xl font-bold mb-4">About</h2>
            <p className="text-muted-foreground mb-10">{doctor.about}</p>

            <h2 className="text-2xl font-bold mb-4">Qualifications</h2>
            <p className="text-muted-foreground mb-10">
              {doctor.qualification}
            </p>

            <h2 className="text-2xl font-bold mb-6">Reviews</h2>

            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="p-5 border border-border rounded-xl bg-muted/20"
                >
                  <div className="flex justify-between mb-2">
                    <p className="font-semibold">{review.name}</p>
                    <div className="flex">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 text-yellow-500"
                          fill="currentColor"
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {review.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {showBookingForm && (
          <BookingForm
            doctorName={doctor.name}
            doctorId={doctor._id}
            doctorFees={doctor.fees}
            onClose={() => setShowBookingForm(false)}
          />
        )}
      </div>
    </div>
  );
}