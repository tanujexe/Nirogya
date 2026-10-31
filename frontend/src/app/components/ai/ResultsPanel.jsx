import { useState } from 'react';
import { AlertTriangle, ShieldAlert, Activity, ClipboardList, Utensils, CalendarCheck, Info, ArrowRight } from 'lucide-react';
import FollowUpChat from './FollowUpChat';
import DoctorRecommendations from './DoctorRecommendations';
import FindSpecialistModal from './FindSpecialistModal';
import ConfidenceMeter from './ConfidenceMeter';
import { motion, AnimatePresence } from 'motion/react';

export default function ResultsPanel({ result, onFollowUpAnswer }) {
  const [isSpecialistModalOpen, setIsSpecialistModalOpen] = useState(false);
  
  if (!result) return null;

  const topPrediction = result.predictions?.[0] || result.ml_prediction?.[0] || { disease: 'General Assessment', confidence: 50 };

  // Render triage/severity banner
  const renderTriage = () => {
    if (result.emergency && result.emergency.triggered) {
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-500/10 border border-red-500/20 rounded-[2rem] p-6 mb-8 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500 opacity-5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center shrink-0 shadow-xl shadow-red-500/30">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
              <h3 className="text-red-500 text-xs font-bold uppercase tracking-[0.2em]">
                Emergency Protocol Activated
              </h3>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{result.emergency.name}</h2>
            <p className="text-red-600 dark:text-red-400 font-bold text-lg">{result.emergency.action}</p>
          </div>
        </motion.div>
      );
    }

    if (result.triage && (result.triage.level === 'CRITICAL' || result.triage.level === 'SEVERE')) {
      const { level, advice } = result.triage;
      return (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-[2rem] p-6 mb-8 flex items-center gap-6 border ${
            level === 'CRITICAL' ? 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30' : 'bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30'
          }`}
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
            level === 'CRITICAL' ? 'bg-red-500 shadow-red-500/20' : 'bg-orange-500 shadow-orange-500/20'
          }`}>
            <AlertTriangle className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-widest mb-1 ${level === 'CRITICAL' ? 'text-red-600' : 'text-orange-600'}`}>
              Clinical Triage: {level}
            </h3>
            <p className={`font-bold text-lg ${level === 'CRITICAL' ? 'text-red-500' : 'text-orange-500'}`}>{advice}</p>
          </div>
        </motion.div>
      );
    }
    return null;
  };

  const renderPredictions = () => {
    const preds = result.predictions || result.ml_prediction || [];
    if (preds.length === 0) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8">
        {/* Left Col: Confidence Meter */}
        <div className="md:col-span-5 space-y-6">
          <ConfidenceMeter confidence={topPrediction.confidence} disease={topPrediction.disease} />
          
          <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--healthcare-cyan)] opacity-10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
            
            <div className="relative z-10">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-2">Primary Analysis</h4>
              <h2 className="text-3xl font-black tracking-tight mb-6 leading-tight">
                {topPrediction.disease}
              </h2>

              <div className="space-y-4">
                <h5 className="text-[10px] font-bold text-white/40 uppercase tracking-widest border-b border-white/10 pb-2">Diagnostic Reasons</h5>
                <ul className="space-y-3">
                  {(topPrediction.why || []).slice(0, 3).map((reason, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                      <div className="w-1.5 h-1.5 bg-[var(--healthcare-cyan)] rounded-full mt-1.5 shrink-0 shadow-[0_0_8px_var(--healthcare-cyan)]" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <motion.button 
                whileHover={{ x: 5 }}
                className="w-full mt-8 py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-3 backdrop-blur-md"
                onClick={() => setIsSpecialistModalOpen(true)}
              >
                <span>Consult Specialists</span>
                <ArrowRight className="w-4 h-4 text-[var(--healthcare-cyan)]" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Right Col: Differential Diagnosis */}
        <div className="md:col-span-7">
          <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 h-full shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] mb-1">Differential Diagnosis</h4>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Differential Ranking</h3>
              </div>
              <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-xl">
                <Activity className="w-5 h-5 text-[var(--healthcare-cyan)]" />
              </div>
            </div>

            <div className="space-y-8">
              {preds.slice(0, 5).map((p, idx) => (
                <div key={idx} className="group">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-400 dark:text-slate-500">0{idx + 1}</span>
                      <span className={`font-bold text-base ${idx === 0 ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-400'}`}>
                        {p.disease}
                      </span>
                    </div>
                    <span className="font-black text-sm text-[var(--healthcare-cyan)]">{p.confidence}%</span>
                  </div>
                  <div className="relative h-2.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${p.confidence}%` }}
                      transition={{ duration: 1, delay: idx * 0.1 }}
                      className={`absolute top-0 left-0 h-full rounded-full ${idx === 0 ? 'bg-gradient-to-r from-indigo-500 to-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 p-5 bg-[var(--healthcare-cyan)]/5 rounded-3xl border border-[var(--healthcare-cyan)]/10 flex items-start gap-4">
              <div className="p-2 bg-[var(--healthcare-cyan)]/10 rounded-xl mt-0.5">
                <Info className="w-4 h-4 text-[var(--healthcare-cyan)]" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Scores represent relative rule-based heuristic pattern rankings across recognized diagnostic categories.
                <span className="font-bold text-[var(--healthcare-cyan)] ml-1">Rankings are clinical aids and do not constitute confirmed laboratory or physician diagnoses.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderClinicalAdvice = () => {
    if (!result.tests?.length && !result.diet && !result.recovery) return null;
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {result.tests && result.tests.length > 0 && (
          <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-white/10 rounded-3xl p-6">
            <h4 className="flex items-center gap-2 font-bold text-xs text-[var(--healthcare-cyan)] uppercase tracking-widest mb-4">
              <ClipboardList className="w-4 h-4" /> Recommended Tests
            </h4>
            <ul className="space-y-3">
              {result.tests.slice(0, 4).map((t, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <div className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}
        {result.diet && (
          <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-white/10 rounded-3xl p-6">
            <h4 className="flex items-center gap-2 font-bold text-xs text-emerald-500 uppercase tracking-widest mb-4">
              <Utensils className="w-4 h-4" /> Dietary Protocol
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{result.diet}</p>
          </div>
        )}
        {result.recovery && (
          <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-white/10 rounded-3xl p-6">
            <h4 className="flex items-center gap-2 font-bold text-xs text-amber-500 uppercase tracking-widest mb-4">
              <CalendarCheck className="w-4 h-4" /> Recovery Roadmap
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{result.recovery}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      {renderTriage()}

      {result.warning && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-amber-500/10 border-l-4 border-amber-500 text-amber-600 dark:text-amber-400 p-4 rounded-r-2xl mb-8 text-sm font-bold flex items-center gap-3"
        >
          <AlertTriangle className="w-5 h-5 shrink-0" />
          {result.warning}
        </motion.div>
      )}

      {/* Structured Lab Results (if applicable) */}
      {result.findings && result.findings.length > 0 && (
        <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 mb-8 overflow-hidden">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
            <div className="p-2 bg-[var(--healthcare-blue)]/10 rounded-xl text-[var(--healthcare-blue)]">
              <Activity className="w-5 h-5" />
            </div>
            Extracted Lab Intelligence
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-4 py-4">Biomarker</th>
                  <th className="px-4 py-4">Result</th>
                  <th className="px-4 py-4">Reference</th>
                  <th className="px-4 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {result.findings.map((f, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4 font-bold text-slate-700 dark:text-slate-200">{f.parameter}</td>
                    <td className="px-4 py-4 font-black">{f.value} <span className="text-[10px] text-slate-400 font-normal">{f.unit}</span></td>
                    <td className="px-4 py-4 text-slate-500 dark:text-slate-400 text-xs">{f.normal_range}</td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-tighter uppercase ${
                        f.status === 'HIGH' ? 'bg-red-500/10 text-red-500' :
                        f.status === 'LOW' ? 'bg-blue-500/10 text-blue-500' :
                        f.status === 'review' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                        f.status === 'unreviewed' ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' :
                        'bg-emerald-500/10 text-emerald-500'
                      }`} title={f.interpretation || f.status}>
                        {f.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Follow-up Chat UI - Prominent placement for simultaneous visibility */}
      <FollowUpChat followUpData={result.follow_up} onAnswer={onFollowUpAnswer} />

      {/* Predictions grid */}
      {renderPredictions()}

      {/* Advice Grid */}
      {renderClinicalAdvice()}

      {/* Specialists Section */}
      {result.doctor_recommendations && (
        <div className="mt-12">
          <DoctorRecommendations recommendations={result.doctor_recommendations} />
        </div>
      )}

      {/* Footer Disclaimer */}
      <div className="bg-slate-100 dark:bg-slate-900/50 rounded-3xl p-8 mt-12 border border-slate-200 dark:border-white/5 flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shrink-0 border border-slate-200 dark:border-white/10 shadow-sm">
          <ShieldAlert className="w-8 h-8 text-slate-400" />
        </div>
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white mb-1">Safety & Medical Disclaimer</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            This AI-driven analysis is for informational purposes and should not be considered professional medical advice, diagnosis, or treatment. 
            If you are experiencing a medical emergency, please contact your local emergency services (112, 911, etc.) immediately. 
            Always consult with a qualified healthcare professional before making any medical decisions.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {isSpecialistModalOpen && (
          <FindSpecialistModal 
            isOpen={isSpecialistModalOpen} 
            onClose={() => setIsSpecialistModalOpen(false)} 
            predictedDisease={topPrediction.disease} 
            recommendedSpecialist={topPrediction.doctor}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
