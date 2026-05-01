import { useState } from 'react';
import { Calendar, Clock, FileText, User, Phone, Mail, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-toastify';
import { bookingsAPI } from '../../utils/api';

export default function BookingForm({ doctorName, doctorId, doctorFees, onClose }) {
  const [formData, setFormData] = useState({
    patientName: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    symptoms: '',
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await bookingsAPI.create({
        doctor: doctorId,
        appointmentDate: formData.date,
        timeSlot: formData.time,
        reason: formData.symptoms,
      });

      toast.success(
        'Appointment booked successfully! You will receive a confirmation email shortly.'
      );
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const timeSlots = [
    '09:00 AM',
    '09:30 AM',
    '10:00 AM',
    '10:30 AM',
    '11:00 AM',
    '11:30 AM',
    '02:00 PM',
    '02:30 PM',
    '03:00 PM',
    '03:30 PM',
    '04:00 PM',
    '04:30 PM',
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card border border-border rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold mb-1">Book Appointment</h2>
              <p className="text-sm text-muted-foreground">with {doctorName}</p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-[var(--healthcare-cyan)]" />
                    <span>Patient Name</span>
                  </div>
                </label>

                <input
                  type="text"
                  name="patientName"
                  value={formData.patientName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--healthcare-cyan)] transition-all"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-[var(--healthcare-cyan)]" />
                    <span>Phone Number</span>
                  </div>
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--healthcare-cyan)] transition-all"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-[var(--healthcare-cyan)]" />
                    <span>Email Address</span>
                  </div>
                </label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--healthcare-cyan)] transition-all"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-[var(--healthcare-cyan)]" />
                    <span>Preferred Date</span>
                  </div>
                </label>

                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--healthcare-cyan)] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-[var(--healthcare-cyan)]" />
                    <span>Preferred Time</span>
                  </div>
                </label>

                <select
                  name="time"
                  value={formData.time}
                  onChange={(e) =>
                    setFormData({ ...formData, time: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2.5 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--healthcare-cyan)] transition-all"
                >
                  <option value="">Select time</option>

                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-[var(--healthcare-cyan)]" />
                    <span>Symptoms / Reason for Visit</span>
                  </div>
                </label>

                <textarea
                  name="symptoms"
                  value={formData.symptoms}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full px-4 py-2.5 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--healthcare-cyan)] transition-all resize-none"
                  placeholder="Please describe your symptoms or reason for consultation"
                />
              </div>
            </div>

            <div className="bg-[var(--healthcare-cyan-light)] dark:bg-[var(--healthcare-cyan-light)] border border-[var(--healthcare-cyan)]/20 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Consultation Fee:</span>
                <span className="text-2xl font-semibold text-[var(--healthcare-cyan)]">
                  ₹{doctorFees}
                </span>
              </div>

              <p className="text-xs text-muted-foreground mt-2">
                Payment can be made online or at the clinic
              </p>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-border hover:bg-accent transition-colors font-medium"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}