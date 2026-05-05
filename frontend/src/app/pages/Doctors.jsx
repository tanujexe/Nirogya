import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Filter, SlidersHorizontal, Loader2 } from "lucide-react";

import { doctorsAPI } from "../utils/api";
import DoctorCard from "../components/doctors/DoctorCard";

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("all");
  const [selectedAvailability, setSelectedAvailability] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [specializationsList, setSpecializationsList] = useState([]);

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const params = {};
        if (selectedSpecialization !== 'all') {
          params.specialization = selectedSpecialization;
        }
        if (searchTerm) {
          params.search = searchTerm;
        }
        const res = await doctorsAPI.getAll(params);
        setDoctors(res.data.data);
      } catch (error) {
        console.error("Error fetching doctors", error);
      } finally {
        setLoading(false);
      }
    };
    
    // Debounce search slightly
    const timeoutId = setTimeout(() => {
      fetchDoctors();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedSpecialization]);

  useEffect(() => {
    const fetchSpecializations = async () => {
      try {
        const res = await doctorsAPI.getSpecializations();
        setSpecializationsList(["all", ...res.data.data]);
      } catch (error) {
        console.error("Error fetching specializations", error);
        setSpecializationsList(["all", "Cardiologist", "Dermatologist", "Pediatrician", "Orthopedic Surgeon", "Gynecologist", "Neurologist"]);
      }
    };
    fetchSpecializations();
  }, []);

  const availabilityOptions = [
    { value: "all", label: "All" },
    { value: "today", label: "Available Today" },
    { value: "tomorrow", label: "Available Tomorrow" },
  ];

    // Client-side filter for availability (simplified since backend structure changed)
    const filteredDoctors = doctors.filter((doctor) => {
      if (selectedAvailability === "all") return true;
      // For now, if "today" or "tomorrow" selected, we just show all since we don't have complex day-logic in backend yet
      // In a real app, you would check doctor.availableSlots array
      return true;
    });

    const clearFilters = () => {
      setSearchTerm("");
      setSelectedSpecialization("all");
      setSelectedAvailability("all");
    };

    return (
      <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-muted/5">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Find Your Perfect{" "}
              <span className="bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] bg-clip-text text-transparent">
                Doctor
              </span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl">
              Browse our network of verified healthcare professionals and book your appointment in seconds.
            </p>
          </motion.div>

          {/* Search + Filters */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-[var(--healthcare-cyan)] transition-colors" />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by doctor name or specialization..."
                  className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--healthcare-cyan)]/20 focus:border-[var(--healthcare-cyan)] transition-all shadow-sm"
                />
              </div>

              {/* Toggle filters */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border transition-all font-medium ${
                  showFilters ? 'bg-accent border-accent text-accent-foreground' : 'bg-card border-border hover:border-[var(--healthcare-cyan)]'
                }`}
              >
                <SlidersHorizontal className="w-5 h-5" />
                Filters
              </button>
            </div>

            {/* Filters panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid sm:grid-cols-2 gap-6 p-8 bg-card border border-border rounded-3xl shadow-xl"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground ml-1">
                      Specialization
                    </label>

                    <select
                      value={selectedSpecialization}
                      onChange={(e) =>
                        setSelectedSpecialization(e.target.value)
                      }
                      className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-[var(--healthcare-cyan)] outline-none"
                    >
                      {specializationsList.map((spec) => (
                        <option key={spec} value={spec}>
                          {spec === "all" ? "All Specializations" : spec}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground ml-1">
                      Availability
                    </label>

                    <select
                      value={selectedAvailability}
                      onChange={(e) =>
                        setSelectedAvailability(e.target.value)
                      }
                      className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-[var(--healthcare-cyan)] outline-none"
                    >
                      {availabilityOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Count */}
          <div className="flex items-center justify-between mb-8">
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-bold text-foreground">
                {filteredDoctors.length}
              </span>{" "}
              verified doctors
            </p>

            {(selectedSpecialization !== "all" ||
              selectedAvailability !== "all" || searchTerm) && (
              <button
                onClick={clearFilters}
                className="text-sm font-bold text-[var(--healthcare-cyan)] hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex flex-col justify-center items-center py-32 space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-[var(--healthcare-cyan)]/20 rounded-full animate-ping" />
                <Loader2 className="absolute top-0 left-0 w-16 h-16 text-[var(--healthcare-cyan)] animate-spin" />
              </div>
              <p className="text-muted-foreground font-medium animate-pulse">Finding doctors for you...</p>
            </div>
          ) : filteredDoctors.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredDoctors.map((doctor) => (
                <DoctorCard key={doctor._id} doctor={doctor} />
              ))}
            </div>
          ) : (
            <div className="text-center py-32 bg-card border border-dashed rounded-3xl">
              <Filter className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-20" />
              <h3 className="text-2xl font-bold mb-2">
                No doctors found
              </h3>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                We couldn't find any doctors matching your current filters. Try adjusting your search term or specialization.
              </p>

              <button
                onClick={clearFilters}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] text-white font-bold shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }