import { Link } from 'react-router-dom';
import { Star, Calendar, Clock, Award } from 'lucide-react';
import { motion } from 'motion/react';

export default function DoctorCard({ doctor }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      className="bg-card border border-border rounded-2xl p-6 hover:shadow-2xl hover:shadow-[var(--healthcare-cyan)]/10 transition-all duration-300 group"
    >
      <div className="flex items-start space-x-4">
        <div className="relative">
          <img
            src={doctor.image}
            alt={doctor.name}
            className="w-20 h-20 rounded-xl object-cover border-2 border-border group-hover:border-[var(--healthcare-cyan)] transition-colors"
          />

          <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] p-1.5 rounded-lg">
            <Award className="w-4 h-4 text-white" />
          </div>
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1 group-hover:text-[var(--healthcare-cyan)] transition-colors">
            {doctor.name}
          </h3>

          <p className="text-sm text-muted-foreground mb-2">
            {doctor.specialization}
          </p>

          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
              <span className="font-medium text-foreground">
                {doctor.rating}
              </span>
              <span>({doctor.reviews})</span>
            </div>

            <div className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{doctor.experience}+ years</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-[var(--healthcare-green)]" />
            <span className="text-sm text-muted-foreground">
              {doctor.availability}
            </span>
          </div>

          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              Consultation Fee
            </p>
            <p className="text-lg font-semibold text-[var(--healthcare-cyan)]">
              ₹{doctor.fees}
            </p>
          </div>
        </div>

        <Link
          to={`/doctor/${doctor.id}`}
          className="block w-full py-2.5 px-4 text-center rounded-xl bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] text-white font-medium hover:shadow-lg hover:shadow-[var(--healthcare-cyan)]/20 transition-all"
        >
          Book Appointment
        </Link>
      </div>
    </motion.div>
  );
}