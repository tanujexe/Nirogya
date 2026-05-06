import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin, Building2, Clock, ChevronRight } from 'lucide-react';
import axios from 'axios';
import api from '../../utils/api';
export default function DoctorRecommendations({ topSpecialist, allRecommendations }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoctors = async () => {
      if (!topSpecialist) return;
      
      setLoading(true);
      try {
        // Fetch from the actual MERN backend
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await axios.get(`${API_URL}/doctors?specialization=${topSpecialist}&limit=5`);
        const data = response.data;
        
        if (data.success) {
          setDoctors(data.data);
        } else if (allRecommendations && allRecommendations.items && allRecommendations.items.length > 0) {
          // Fallback to python static doctors if DB fails or is empty and python provided some
          const fallbackDocs = allRecommendations.items.find(i => i.specialist === topSpecialist)?.doctors || [];
          setDoctors(fallbackDocs);
        }
      } catch (error) {
        console.error("Error fetching doctors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [topSpecialist, allRecommendations]);

  if (!topSpecialist && !allRecommendations) return null;

  return (
    <div className="mt-8 pt-8 border-t border-white/10">
      <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
        <div className="p-2 bg-[var(--healthcare-cyan)]/10 rounded-xl">
          <span className="text-xl">👨‍⚕️</span>
        </div>
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
          Recommended Doctors
        </span>
      </h3>
      <p className="text-muted-foreground text-sm mb-6">
        Based on your symptoms, we recommend consulting a <strong className="text-[var(--healthcare-cyan)]">{topSpecialist}</strong>.
      </p>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="w-8 h-8 border-4 border-[var(--healthcare-cyan)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : doctors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {doctors.map((doc, idx) => {
            // Support both DB doctor format and python static format
            const name = doc.userId?.name || doc.name || 'Doctor';
            const spec = doc.specialization || topSpecialist;
            const rating = doc.rating || 4.5;
            const reviews = doc.reviews || Math.floor(Math.random() * 100) + 20;
            const hospital = doc.hospitalAffiliation || doc.hospital || 'Nirogya Partner Hospital';
            const fee = doc.consultationFee || doc.fees_inr || 500;
            const docId = doc._id || null;

            return (
              <div key={idx} className="bg-card border border-border hover:border-[var(--healthcare-cyan)]/50 rounded-2xl p-5 transition-all hover:shadow-lg flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-lg text-[var(--healthcare-cyan)] truncate">Dr. {name}</h4>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{spec}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded-lg text-xs font-bold">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{rating}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-6 flex-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="w-4 h-4" />
                    <span className="truncate">{hospital}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{doc.location || doc.address?.city || 'Gwalior, MP'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Fee: ₹{fee}</span>
                  </div>
                </div>

                <button 
                  onClick={() => docId ? navigate(`/doctor/${docId}`) : navigate('/doctors')}
                  className="w-full py-3 bg-accent/50 hover:bg-gradient-to-r hover:from-[var(--healthcare-cyan)] hover:to-[var(--healthcare-blue)] hover:text-white hover:border-transparent border border-border text-[var(--healthcare-cyan)] rounded-xl font-bold transition-all flex items-center justify-center gap-2 group"
                >
                  <span>Book Appointment</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-accent rounded-2xl p-6 text-center">
          <p className="text-muted-foreground mb-4">No specific doctors found for {topSpecialist} in our database right now.</p>
          <button 
            onClick={() => navigate('/doctors')}
            className="px-6 py-2 bg-[var(--healthcare-cyan)] text-white rounded-xl font-medium"
          >
            Browse All Doctors
          </button>
        </div>
      )}
    </div>
  );
}
