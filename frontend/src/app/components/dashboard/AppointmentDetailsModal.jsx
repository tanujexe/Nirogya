import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, User, Phone, Mail, Calendar, Clock, FileText, ExternalLink, 
  ShieldCheck, Info, CheckCircle2, AlertCircle, Clock3, MapPin, 
  Activity, Droplets, Ambulance, Stethoscope, Copy, Check, 
  CreditCard, FlaskConical, Building2
} from 'lucide-react';
import { format } from 'date-fns';

export default function AppointmentDetailsModal({ isOpen, onClose, appointment }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !appointment) return null;

  const handleCopyId = () => {
    if (appointment?._id) {
      navigator.clipboard?.writeText(appointment._id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Safe field resolvers
  const patientName =
    appointment.details?.patientName ||
    appointment.metadata?.patientName ||
    appointment.userId?.name ||
    'N/A';

  const patientEmail =
    appointment.details?.email ||
    appointment.metadata?.email ||
    appointment.userId?.email ||
    'No email provided';

  const patientPhone =
    appointment.userId?.phone ||
    appointment.details?.phone ||
    appointment.metadata?.phone ||
    appointment.phone ||
    'No phone provided';

  const patientAge =
    appointment.userId?.age ||
    appointment.details?.age ||
    appointment.metadata?.age;

  const patientGender =
    appointment.userId?.gender ||
    appointment.details?.gender ||
    appointment.metadata?.gender;

  const bloodGroup =
    appointment.details?.bloodGroup ||
    appointment.metadata?.bloodGroup ||
    appointment.userId?.bloodGroup;

  const patientAddress =
    appointment.details?.address ||
    appointment.metadata?.address ||
    appointment.pickupLocation?.address ||
    (typeof appointment.userId?.address === 'string'
      ? appointment.userId.address
      : appointment.userId?.address?.city
      ? `${appointment.userId.address.street ? appointment.userId.address.street + ', ' : ''}${appointment.userId.address.city}`
      : null);

  const timeSlot =
    appointment.timeSlot ||
    appointment.time ||
    appointment.details?.timeSlot ||
    appointment.details?.time ||
    appointment.metadata?.timeSlot ||
    'Not specified';

  let formattedDate = 'Date not specified';
  try {
    if (appointment.date) {
      formattedDate = format(new Date(appointment.date), 'PPPP');
    }
  } catch (e) {
    formattedDate = String(appointment.date || 'N/A');
  }

  let formattedCreatedAt = null;
  try {
    if (appointment.createdAt) {
      formattedCreatedAt = format(new Date(appointment.createdAt), 'PPP p');
    }
  } catch (e) {
    // Ignore
  }

  const providerName =
    appointment.providerId?.businessName ||
    appointment.providerId?.userId?.name ||
    appointment.providerId?.name ||
    (appointment.type === 'doctor' ? 'Assigned Doctor' : 'Healthcare Provider');

  const providerSpecialization =
    appointment.providerId?.specialization ||
    appointment.providerId?.category ||
    appointment.providerModel ||
    (appointment.type ? `${appointment.type.charAt(0).toUpperCase() + appointment.type.slice(1)} Service` : 'Healthcare Service');

  const providerPhone =
    appointment.providerId?.userId?.phone ||
    appointment.providerId?.phone;

  const providerEmail =
    appointment.providerId?.userId?.email ||
    appointment.providerId?.email;

  const providerAddress =
    appointment.providerId?.address ||
    appointment.providerId?.city;

  const notes =
    appointment.notes ||
    appointment.reason ||
    appointment.details?.notes ||
    appointment.details?.reason ||
    appointment.metadata?.notes ||
    'No specific notes provided';

  const status = appointment.status || 'pending';
  const bookingType = appointment.type || 'doctor';
  const paymentStatus = appointment.paymentStatus || 'pending';

  // Type-specific extras
  const testType = appointment.details?.testType || appointment.details?.testName || appointment.metadata?.testType;
  const emergencyType = appointment.details?.emergencyType || appointment.metadata?.emergencyType;
  const units = appointment.details?.units || appointment.metadata?.units;
  const pickupAddress = appointment.pickupLocation?.address || appointment.details?.address || appointment.metadata?.address;
  const destinationAddress = appointment.destination?.address || appointment.details?.destination;

  // Status badge config
  const getStatusBadge = () => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
          label: 'Confirmed',
          className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
        };
      case 'completed':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
          label: 'Completed',
          className: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20'
        };
      case 'cancelled':
        return {
          icon: <AlertCircle className="w-3.5 h-3.5" />,
          label: 'Cancelled',
          className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
        };
      case 'in-progress':
        return {
          icon: <Activity className="w-3.5 h-3.5" />,
          label: 'In Progress',
          className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
        };
      default:
        return {
          icon: <Clock3 className="w-3.5 h-3.5" />,
          label: 'Pending Confirmation',
          className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
        };
    }
  };

  const getTypeBadge = () => {
    switch (bookingType.toLowerCase()) {
      case 'doctor':
        return {
          icon: <Stethoscope className="w-3.5 h-3.5" />,
          label: 'Doctor Consultation',
          className: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20'
        };
      case 'lab':
        return {
          icon: <FlaskConical className="w-3.5 h-3.5" />,
          label: 'Lab Diagnostics',
          className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
        };
      case 'blood':
      case 'bloodbank':
        return {
          icon: <Droplets className="w-3.5 h-3.5" />,
          label: 'Blood Bank',
          className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
        };
      case 'ambulance':
        return {
          icon: <Ambulance className="w-3.5 h-3.5" />,
          label: 'Ambulance Emergency',
          className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
        };
      default:
        return {
          icon: <Activity className="w-3.5 h-3.5" />,
          label: bookingType.toUpperCase(),
          className: 'bg-muted text-muted-foreground border-border'
        };
    }
  };

  const statusBadge = getStatusBadge();
  const typeBadge = getTypeBadge();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-background/80 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] z-10"
        >
          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-border bg-gradient-to-r from-[var(--healthcare-cyan)]/10 via-transparent to-[var(--healthcare-blue)]/10 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Appointment Details</h2>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusBadge.className}`}>
                  {statusBadge.icon}
                  {statusBadge.label}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${typeBadge.className}`}>
                  {typeBadge.icon}
                  {typeBadge.label}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                <span>Ref: #{appointment._id}</span>
                <button 
                  onClick={handleCopyId}
                  className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  title="Copy Appointment ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="font-sans text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
                </button>
                {formattedCreatedAt && (
                  <span className="hidden md:inline font-sans text-muted-foreground/80">• Booked on {formattedCreatedAt}</span>
                )}
              </div>
            </div>

            <button 
              onClick={onClose}
              className="self-end sm:self-center p-2.5 hover:bg-accent rounded-2xl transition-colors border border-border/50 text-muted-foreground hover:text-foreground"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
            
            {/* Cancellation Notice if Cancelled */}
            {status === 'cancelled' && (
              <div className="p-4 sm:p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3.5 text-red-600 dark:text-red-400">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">Appointment Cancelled</p>
                  <p className="text-xs mt-1 text-red-600/90 dark:text-red-400/90">
                    Reason: {appointment.cancelReason || 'Cancelled by provider or patient.'}
                  </p>
                </div>
              </div>
            )}

            {/* Primary Info Cards: Patient Info & Provider/Service Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Patient Information Card */}
              <div className="bg-muted/30 border border-border rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-[var(--healthcare-cyan)]" />
                    Patient Information
                  </h3>
                  {bloodGroup && (
                    <span className="px-2.5 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-bold rounded-lg">
                      Blood: {bloodGroup}
                    </span>
                  )}
                </div>

                <div className="flex items-start gap-4 pt-1">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--healthcare-cyan)]/20 to-[var(--healthcare-blue)]/20 border border-[var(--healthcare-cyan)]/20 flex items-center justify-center text-[var(--healthcare-cyan)] font-black text-xl shadow-sm shrink-0">
                    {patientName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-lg text-foreground truncate">{patientName}</p>
                    {(patientAge || patientGender) && (
                      <p className="text-xs text-muted-foreground font-medium mt-0.5">
                        {[patientAge ? `${patientAge} yrs` : null, patientGender].filter(Boolean).join(' • ')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-border/50 text-sm">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Mail className="w-4 h-4 text-[var(--healthcare-cyan)] shrink-0" />
                    <span className="font-medium text-foreground truncate">{patientEmail}</span>
                  </div>

                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Phone className="w-4 h-4 text-[var(--healthcare-cyan)] shrink-0" />
                    <span className="font-medium text-foreground">
                      {patientPhone !== 'No phone provided' ? (
                        <a href={`tel:${patientPhone}`} className="hover:text-[var(--healthcare-cyan)] transition-colors underline-offset-4 hover:underline">
                          {patientPhone}
                        </a>
                      ) : (
                        <span className="italic text-muted-foreground">{patientPhone}</span>
                      )}
                    </span>
                  </div>

                  {patientAddress && (
                    <div className="flex items-start gap-3 text-muted-foreground">
                      <MapPin className="w-4 h-4 text-[var(--healthcare-cyan)] shrink-0 mt-0.5" />
                      <span className="font-medium text-foreground text-xs leading-relaxed">{patientAddress}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Provider / Clinic Information Card */}
              <div className="bg-muted/30 border border-border rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[var(--healthcare-blue)]" />
                    Service & Provider
                  </h3>
                  <span className="px-2.5 py-0.5 bg-[var(--healthcare-blue)]/10 border border-[var(--healthcare-blue)]/20 text-[var(--healthcare-blue)] text-xs font-bold rounded-lg uppercase">
                    {bookingType}
                  </span>
                </div>

                <div className="flex items-start gap-4 pt-1">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--healthcare-blue)]/20 to-indigo-500/20 border border-[var(--healthcare-blue)]/20 flex items-center justify-center text-[var(--healthcare-blue)] font-black text-xl shadow-sm shrink-0">
                    {bookingType === 'doctor' ? <Stethoscope className="w-6 h-6" /> :
                     bookingType === 'lab' ? <FlaskConical className="w-6 h-6" /> :
                     bookingType === 'blood' || bookingType === 'bloodbank' ? <Droplets className="w-6 h-6" /> :
                     <Ambulance className="w-6 h-6" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-lg text-foreground truncate">{providerName}</p>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">{providerSpecialization}</p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-border/50 text-sm">
                  {providerPhone && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Phone className="w-4 h-4 text-[var(--healthcare-blue)] shrink-0" />
                      <span className="font-medium text-foreground">
                        <a href={`tel:${providerPhone}`} className="hover:text-[var(--healthcare-blue)] transition-colors">
                          {providerPhone}
                        </a>
                      </span>
                    </div>
                  )}

                  {providerEmail && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Mail className="w-4 h-4 text-[var(--healthcare-blue)] shrink-0" />
                      <span className="font-medium text-foreground truncate">{providerEmail}</span>
                    </div>
                  )}

                  {providerAddress && (
                    <div className="flex items-start gap-3 text-muted-foreground">
                      <MapPin className="w-4 h-4 text-[var(--healthcare-blue)] shrink-0 mt-0.5" />
                      <span className="font-medium text-foreground text-xs leading-relaxed">{providerAddress}</span>
                    </div>
                  )}

                  {/* Payment Indicator */}
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <CreditCard className="w-4 h-4 text-[var(--healthcare-blue)] shrink-0" />
                    <span className="text-xs font-semibold capitalize flex items-center gap-1.5">
                      Payment Status: 
                      <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                        paymentStatus === 'completed' || paymentStatus === 'paid' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                        'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      }`}>
                        {paymentStatus}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Schedule Section */}
            <div className="bg-muted/30 border border-border rounded-3xl p-6 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--healthcare-cyan)]" />
                Schedule & Timing
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-card border border-border rounded-2xl flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <Calendar className="w-4 h-4 text-[var(--healthcare-cyan)]" />
                    <span>Appointment Date</span>
                  </div>
                  <span className="font-bold text-base text-foreground">{formattedDate}</span>
                </div>

                <div className="p-4 bg-card border border-border rounded-2xl flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <Clock className="w-4 h-4 text-[var(--healthcare-cyan)]" />
                    <span>Time Slot</span>
                  </div>
                  <span className="font-bold text-base text-foreground">{timeSlot}</span>
                </div>

                <div className="p-4 bg-card border border-border rounded-2xl flex flex-col gap-1.5 sm:col-span-2 md:col-span-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <Activity className="w-4 h-4 text-[var(--healthcare-cyan)]" />
                    <span>Consultation Type</span>
                  </div>
                  <span className="font-bold text-base text-foreground capitalize">
                    {bookingType === 'doctor' ? 'Clinical Consultation' : `${bookingType} Service`}
                  </span>
                </div>
              </div>
            </div>

            {/* Service-Specific Details if Available */}
            {(testType || emergencyType || units || pickupAddress || destinationAddress) && (
              <div className="bg-muted/30 border border-border rounded-3xl p-6 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Service Specifics
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {testType && (
                    <div className="p-4 bg-card border border-border rounded-2xl">
                      <span className="text-xs text-muted-foreground font-semibold block mb-1">Diagnostic Test</span>
                      <span className="font-bold text-sm text-foreground">{testType}</span>
                    </div>
                  )}
                  {emergencyType && (
                    <div className="p-4 bg-card border border-border rounded-2xl">
                      <span className="text-xs text-muted-foreground font-semibold block mb-1">Emergency Urgency</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        emergencyType === 'Critical' ? 'bg-red-500/10 text-red-600' :
                        emergencyType === 'Urgent' ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600'
                      }`}>
                        {emergencyType}
                      </span>
                    </div>
                  )}
                  {units && (
                    <div className="p-4 bg-card border border-border rounded-2xl">
                      <span className="text-xs text-muted-foreground font-semibold block mb-1">Required Quantity</span>
                      <span className="font-bold text-sm text-foreground">{units} Unit(s)</span>
                    </div>
                  )}
                  {pickupAddress && bookingType === 'ambulance' && (
                    <div className="p-4 bg-card border border-border rounded-2xl">
                      <span className="text-xs text-muted-foreground font-semibold block mb-1">Pickup Location</span>
                      <span className="font-medium text-xs text-foreground">{pickupAddress}</span>
                    </div>
                  )}
                  {destinationAddress && bookingType === 'ambulance' && (
                    <div className="p-4 bg-card border border-border rounded-2xl">
                      <span className="text-xs text-muted-foreground font-semibold block mb-1">Destination</span>
                      <span className="font-medium text-xs text-foreground">{destinationAddress}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reason for Visit / Symptoms */}
            <div className="bg-muted/30 border border-border rounded-3xl p-6 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--healthcare-cyan)]" />
                Reason for Visit & Notes
              </h3>
              <div className="p-5 bg-card border border-border rounded-2xl text-foreground font-medium text-sm leading-relaxed">
                "{notes}"
              </div>
            </div>

            {/* Shared Reports (Medical Vault) */}
            <div className="bg-muted/30 border border-border rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Shared Medical Vault Records
                </h3>
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[11px] font-bold text-emerald-600 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> 
                  {appointment.sharedReports?.length || 0} Records Attached
                </span>
              </div>

              {appointment.sharedReports && appointment.sharedReports.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {appointment.sharedReports.map((report) => (
                    <a 
                      key={report._id}
                      href={report.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 bg-card border border-border rounded-2xl flex items-center justify-between group hover:border-[var(--healthcare-cyan)] hover:shadow-lg hover:shadow-[var(--healthcare-cyan)]/5 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="p-3 rounded-xl bg-[var(--healthcare-cyan)]/10 text-[var(--healthcare-cyan)] group-hover:bg-[var(--healthcare-cyan)] group-hover:text-white transition-colors shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm text-foreground truncate group-hover:text-[var(--healthcare-cyan)] transition-colors">
                            {report.title || 'Medical Document'}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                            {report.category && (
                              <span className="px-1.5 py-0.5 rounded bg-muted font-bold uppercase">
                                {report.category}
                              </span>
                            )}
                            <span className="truncate">{report.hospitalName || 'Clinic Report'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-2 rounded-xl text-muted-foreground group-hover:text-[var(--healthcare-cyan)] transition-colors shrink-0 ml-2">
                        <ExternalLink className="w-4 h-4" />
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center bg-card border border-dashed border-border rounded-2xl">
                  <Info className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs font-bold text-muted-foreground">No shared medical reports attached to this appointment</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5">Patient did not attach vault documents for this visit</p>
                </div>
              )}
            </div>

          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground text-center sm:text-left">
              Need updates? Contact support or manage booking status directly from your dashboard.
            </p>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[var(--healthcare-cyan)] hover:bg-[var(--healthcare-cyan-hover)] text-white font-bold transition-all shadow-md shadow-cyan-500/20 active:scale-[0.98]"
            >
              Close Details
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
