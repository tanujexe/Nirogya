import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  FileText, 
  User, 
  Phone, 
  Mail, 
  X, 
  Check, 
  Shield, 
  Info, 
  ArrowRight, 
  ArrowLeft, 
  Loader2,
  Ambulance,
  Droplets,
  FlaskConical,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-toastify';
import { bookingsAPI, healthRecordsAPI } from '../../utils/api';
import { format } from 'date-fns';

export default function GeneralBookingForm({ provider, type, onClose }) {
  const [step, setStep] = useState(1);
  const [reports, setReports] = useState([]);
  const [selectedReports, setSelectedReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  
  const [formData, setFormData] = useState({
    patientName: '',
    email: '',
    phone: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    timeSlot: '',
    notes: '',
    bloodGroup: '', // For blood bank
    testType: '', // For lab
    emergencyType: 'Routine', // For ambulance
    address: provider.address || '',
  });

  const [loading, setLoading] = useState(false);

  const providerName = provider.businessName || provider.userId?.name || 'Provider';
  const providerId = provider._id;

  useEffect(() => {
    if (step === 2 && type === 'doctor') {
      fetchUserReports();
    }
  }, [step, type]);

  const fetchUserReports = async () => {
    try {
      setLoadingReports(true);
      const { data } = await healthRecordsAPI.getAll();
      setReports(data.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Could not load your medical reports');
    } finally {
      setLoadingReports(false);
    }
  };

  const toggleReportSelection = (id) => {
    setSelectedReports(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      const bookingData = {
        providerId,
        type,
        date: formData.date,
        timeSlot: formData.timeSlot || 'Anytime',
        notes: formData.notes,
        sharedReports: selectedReports,
        // Additional metadata
        metadata: {
          patientName: formData.patientName,
          phone: formData.phone,
          email: formData.email,
          bloodGroup: formData.bloodGroup,
          testType: formData.testType,
          emergencyType: formData.emergencyType,
          address: formData.address
        }
      };

      await bookingsAPI.create(bookingData);

      toast.success(
        `${type.charAt(0).toUpperCase() + type.slice(1)} request submitted successfully!`
      );
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request. Please try again.');
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
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
  ];

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card border border-border rounded-[40px] p-0 max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-8 border-b border-border flex items-center justify-between bg-gradient-to-r from-[var(--healthcare-cyan)]/5 to-[var(--healthcare-blue)]/5">
            <div>
              <h2 className="text-3xl font-black mb-1">
                {type === 'doctor' ? 'Book Appointment' : 
                 type === 'ambulance' ? 'Request Ambulance' : 
                 type === 'bloodbank' ? 'Request Blood' : 'Book Lab Test'}
              </h2>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                With <span className="font-bold text-foreground">{providerName}</span>
              </p>
            </div>

            <button onClick={onClose} className="p-3 rounded-2xl hover:bg-muted transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            <form id="booking-form" onSubmit={(e) => {
              e.preventDefault();
              if (type === 'doctor' && step === 1) setStep(2);
              else handleSubmit();
            }} className="space-y-6">
              
              {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Patient Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input name="patientName" value={formData.patientName} onChange={handleChange} required className="w-full pl-12 pr-4 py-4 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-[var(--healthcare-cyan)] outline-none transition-all" placeholder="Enter name" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input name="phone" value={formData.phone} onChange={handleChange} required className="w-full pl-12 pr-4 py-4 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-[var(--healthcare-cyan)] outline-none transition-all" placeholder="Enter phone" />
                    </div>
                  </div>

                  {/* Type Specific Fields */}
                  {type === 'bloodbank' && (
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Required Blood Group</label>
                      <div className="grid grid-cols-4 gap-2">
                        {bloodGroups.map(bg => (
                          <button
                            key={bg}
                            type="button"
                            onClick={() => setFormData({...formData, bloodGroup: bg})}
                            className={`py-3 rounded-xl border font-bold transition-all ${formData.bloodGroup === bg ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20' : 'bg-muted/50 border-border hover:border-rose-500/50'}`}
                          >
                            {bg}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {type === 'lab' && (
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Select Test</label>
                      <select name="testType" value={formData.testType} onChange={handleChange} required className="w-full px-4 py-4 bg-muted/50 border border-border rounded-2xl outline-none">
                        <option value="">Select a test</option>
                        {provider.testCategories?.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {type === 'ambulance' && (
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Emergency Level</label>
                      <div className="flex gap-4">
                        {['Routine', 'Urgent', 'Critical'].map(level => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setFormData({...formData, emergencyType: level})}
                            className={`flex-1 py-3 rounded-xl border font-bold transition-all ${formData.emergencyType === level ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20' : 'bg-muted/50 border-border'}`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Date & Time */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Preferred Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input type="date" name="date" value={formData.date} onChange={handleChange} required className="w-full pl-12 pr-4 py-4 bg-muted/50 border border-border rounded-2xl outline-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Preferred Time</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <select name="timeSlot" value={formData.timeSlot} onChange={handleChange} required className="w-full pl-12 pr-4 py-4 bg-muted/50 border border-border rounded-2xl outline-none appearance-none">
                        <option value="">Select Time</option>
                        {timeSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Address (for Home Collection / Ambulance) */}
                  {(type === 'lab' || type === 'ambulance') && (
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Pickup/Collection Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-4 w-4 h-4 text-muted-foreground" />
                        <textarea name="address" value={formData.address} onChange={handleChange} required rows={2} className="w-full pl-12 pr-4 py-4 bg-muted/50 border border-border rounded-2xl outline-none resize-none" placeholder="Enter complete address" />
                      </div>
                    </div>
                  )}

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Additional Notes</label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-4 w-4 h-4 text-muted-foreground" />
                      <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} className="w-full pl-12 pr-4 py-4 bg-muted/50 border border-border rounded-2xl outline-none resize-none" placeholder="Any symptoms or special requests..." />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && type === 'doctor' && (
                <div className="space-y-6">
                  <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl flex gap-4">
                    <Shield className="w-8 h-8 text-blue-500 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-blue-600">Smart Vault Integration</p>
                      <p className="text-xs text-muted-foreground">Securely share your medical reports from the vault with the doctor.</p>
                    </div>
                  </div>

                  {loadingReports ? (
                    <div className="py-20 flex flex-col items-center gap-4">
                      <Loader2 className="w-10 h-10 animate-spin text-[var(--healthcare-cyan)]" />
                      <p className="text-muted-foreground font-medium">Accessing your vault...</p>
                    </div>
                  ) : reports.length > 0 ? (
                    <div className="grid gap-3">
                      {reports.map(report => (
                        <div 
                          key={report._id}
                          onClick={() => toggleReportSelection(report._id)}
                          className={`p-4 border rounded-2xl cursor-pointer transition-all flex items-center gap-4 ${selectedReports.includes(report._id) ? 'bg-[var(--healthcare-cyan)]/10 border-[var(--healthcare-cyan)] shadow-lg shadow-cyan-500/5' : 'bg-card border-border hover:bg-muted'}`}
                        >
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${selectedReports.includes(report._id) ? 'bg-[var(--healthcare-cyan)] border-[var(--healthcare-cyan)]' : 'border-border'}`}>
                            {selectedReports.includes(report._id) && <Check className="w-4 h-4 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold truncate">{report.title}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-black">{report.category}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center border-2 border-dashed border-border rounded-[40px]">
                      <FlaskConical className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="text-muted-foreground font-bold">No reports found in your vault</p>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Footer Actions */}
          <div className="p-8 border-t border-border bg-card flex gap-4">
            {step === 2 && (
              <button onClick={() => setStep(1)} className="flex-1 py-4 rounded-2xl border border-border font-bold hover:bg-muted transition-all">
                Back
              </button>
            )}
            
            <button
              type="submit"
              form="booking-form"
              disabled={loading}
              className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] text-white font-black shadow-xl hover:shadow-cyan-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <span>{type === 'doctor' && step === 1 ? 'Next: Share Reports' : 'Submit Request'}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
