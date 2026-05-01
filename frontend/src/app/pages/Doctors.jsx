import { useState, useEffect } from "react";
import { motion } from "motion/react";
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

  // Client-side filter for availability (since backend mock might not fully support day-of-week search yet)
  const filteredDoctors = doctors.filter((doctor) => {
    if (selectedAvailability === "all") return true;
    
    const today = new Date().toLocaleDateString('en-US', { weekday: 'lowercase' });
    const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toLocaleDateString('en-US', { weekday: 'lowercase' });
    
    if (selectedAvailability === "today") {
      return doctor.availability?.[today]?.available;
    }
    if (selectedAvailability === "tomorrow") {
      return doctor.availability?.[tomorrow]?.available;
    }
    return true;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSpecialization("all");
    setSelectedAvailability("all");
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Find Your Perfect{" "}
            <span className="bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] bg-clip-text text-transparent">
              Doctor
            </span>
          </h1>

          <p className="text-lg text-muted-foreground">
            Browse our network of verified healthcare professionals
          </p>
        </motion.div>

        {/* Search + Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search doctors..."
                className="w-full pl-12 pr-4 py-3.5 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--healthcare-cyan)]"
              />
            </div>

            {/* Toggle filters */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-border hover:bg-accent transition-all"
            >
              <SlidersHorizontal className="w-5 h-5" />
              Filters
            </button>
          </div>

          {/* Filters panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="grid sm:grid-cols-2 gap-4 p-6 bg-card border border-border rounded-2xl"
            >
              <div>
                <label className="block text-sm font-medium mb-2">
                  Specialization
                </label>

                <select
                  value={selectedSpecialization}
                  onChange={(e) =>
                    setSelectedSpecialization(e.target.value)
                  }
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-xl"
                >
                  {specializationsList.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec === "all" ? "All Specializations" : spec}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Availability
                </label>

                <select
                  value={selectedAvailability}
                  onChange={(e) =>
                    setSelectedAvailability(e.target.value)
                  }
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-xl"
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
        </div>

        {/* Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {filteredDoctors.length}
            </span>{" "}
            doctors
          </p>

          {(selectedSpecialization !== "all" ||
            selectedAvailability !== "all") && (
            <button
              onClick={clearFilters}
              className="text-sm text-[var(--healthcare-cyan)]"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 text-[var(--healthcare-cyan)] animate-spin" />
          </div>
        ) : filteredDoctors.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doctor) => (
              <DoctorCard key={doctor._id || doctor.id} doctor={doctor} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Filter className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              No doctors found
            </h3>
            <p className="text-muted-foreground mb-6">
              Try changing filters or search term
            </p>

            <button
              onClick={clearFilters}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] text-white"
            >
              Reset
            </button>
          </div>
        )}
      </div>
    </div>
  );
}