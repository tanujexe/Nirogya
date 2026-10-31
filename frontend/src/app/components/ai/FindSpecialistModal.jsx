import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, MapPin, Building2, Clock, ChevronRight, User, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { doctorsAPI } from '../../utils/api';

const mapDiseaseToDepartment = (disease) => {
  if (!disease) return 'General Physician';
  const d = disease.toLowerCase();
  
  if (d.includes('fever') || d.includes('flu') || d.includes('cold') || d.includes('cough') || d.includes('infection') || d.includes('malaria') || d.includes('typhoid') || d.includes('dengue')) return 'General Physician';
  if (d.includes('skin') || d.includes('rash') || d.includes('acne') || d.includes('dermat') || d.includes('fungal') || d.includes('psoriasis')) return 'Dermatologist';
  if (d.includes('brain') || d.includes('head') || d.includes('neurolog') || d.includes('migraine') || d.includes('stroke') || d.includes('epilepsy') || d.includes('paralysis')) return 'Neurologist';
  if (d.includes('heart') || d.includes('cardiac') || d.includes('chest') || d.includes('hypertens') || d.includes('cholesterol') || d.includes('artery')) return 'Cardiologist';
  if (d.includes('child') || d.includes('pediat') || d.includes('infant') || d.includes('vaccination')) return 'Pediatrician';
  if (d.includes('bone') || d.includes('joint') || d.includes('ortho') || d.includes('fracture') || d.includes('arthritis') || d.includes('back pain')) return 'Orthopedic';
  if (d.includes('eye') || d.includes('vision') || d.includes('opthalm') || d.includes('cataract')) return 'Ophthalmologist';
  if (d.includes('stomach') || d.includes('gastric') || d.includes('digest') || d.includes('liver') || d.includes('acidity') || d.includes('constipation')) return 'Gastroenterologist';
  if (d.includes('kidney') || d.includes('renal') || d.includes('urinar') || d.includes('nephro') || d.includes('stone')) return 'Nephrologist';
  if (d.includes('women') || d.includes('pregnan') || d.includes('gynecol') || d.includes('pcos') || d.includes('period')) return 'Gynecologist';
  if (d.includes('teeth') || d.includes('dental') || d.includes('gum') || d.includes('cavity')) return 'Dentist';
  if (d.includes('mental') || d.includes('depress') || d.includes('anxiety') || d.includes('psych') || d.includes('stress')) return 'Psychiatrist';
  if (d.includes('diabetes') || d.includes('sugar') || d.includes('thyroid') || d.includes('hormon') || d.includes('endocrin')) return 'Endocrinologist';
  if (d.includes('lung') || d.includes('breath') || d.includes('asthma') || d.includes('pulmon') || d.includes('pneumonia') || d.includes('tb')) return 'Pulmonologist';
  if (d.includes('cancer') || d.includes('tumor') || d.includes('oncol')) return 'Oncologist';
  if (d.includes('urolog') || d.includes('bladder') || d.includes('prostate')) return 'Urologist';
  
  return 'General Physician';
};

export default function FindSpecialistModal({ isOpen, onClose, predictedDisease, recommendedSpecialist }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [department, setDepartment] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      const dep = recommendedSpecialist || mapDiseaseToDepartment(predictedDisease);
      setDepartment(dep);
      fetchDoctors(dep);
    }
  }, [isOpen, predictedDisease, recommendedSpecialist]);

  const fetchDoctors = async (dep) => {
    setLoading(true);
    try {
      const res = await doctorsAPI.getAll({ specialization: dep, limit: 10 });
      setDoctors(res.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch specialist doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl overflow-hidden border border-white/10"
      >
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[var(--healthcare-cyan)] rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white">Recommended Specialists</h2>
              <p className="text-sm text-slate-500 font-medium">Mapped to <span className="text-[var(--healthcare-cyan)] font-bold">{department}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="p-8 max-h-[65vh] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-4 border-[var(--healthcare-cyan)] border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-500 font-medium animate-pulse">Matching specialists for you...</p>
            </div>
          ) : doctors.length > 0 ? (
            <div className="grid gap-4">
              {doctors.map((doc) => (
                <motion.div 
                  key={doc._id}
                  whileHover={{ x: 5 }}
                  className="group p-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:border-[var(--healthcare-cyan)]/30 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer"
                  onClick={() => navigate(`/doctor/${doc._id}`)}
                >
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--healthcare-cyan)]/10 flex items-center justify-center text-[var(--healthcare-cyan)] text-2xl font-black border border-cyan-500/10 overflow-hidden">
                      {doc.userId?.avatar ? (
                         <img src={doc.userId.avatar} alt={doc.userId.name} className="w-full h-full object-cover" />
                      ) : (
                        doc.userId?.name?.charAt(0) || "D"
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-lg text-slate-800 dark:text-white group-hover:text-[var(--healthcare-cyan)] transition-colors">Dr. {doc.userId?.name}</h4>
                        {doc.verified && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{doc.specialization}</span>
                        <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          {doc.rating || '4.8'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-2 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {doc.experience || '8+'} years experience
                      </div>
                    </div>
                  </div>

                  <button className="w-full sm:w-auto px-6 py-3 bg-[var(--healthcare-cyan)] text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/10 group-hover:shadow-cyan-500/30 transition-all flex items-center justify-center gap-2">
                    Book Now
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No exact match found</h3>
              <p className="text-slate-500 max-w-sm mx-auto mb-8">
                We couldn't find an exact specialist in <span className="text-[var(--healthcare-cyan)] font-bold">{department}</span> right now. We recommend consulting a General Physician.
              </p>
              <button 
                onClick={() => fetchDoctors('General Physician')}
                className="px-8 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold text-slate-600 dark:text-slate-300 hover:bg-[var(--healthcare-cyan)] hover:text-white transition-all"
              >
                Find General Physician
              </button>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
             AI-Recommended Specialists Based on Symptom Patterns
           </p>
        </div>
      </motion.div>
    </div>
  );
}
