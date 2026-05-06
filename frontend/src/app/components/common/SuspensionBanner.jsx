import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, Calendar, Clock, ShieldAlert, X } from "lucide-react";
import { useState } from "react";

export default function SuspensionBanner({ details }) {
  const [isVisible, setIsVisible] = useState(true);

  if (!details || !details.isSuspended || !isVisible) return null;

  const isRemoval = details.type === 'removal';
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="mb-8 overflow-hidden"
      >
        <div className={`relative border-2 rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-xl transition-all ${
          isRemoval 
          ? 'bg-rose-500/5 border-rose-500/20 text-rose-700' 
          : 'bg-orange-500/5 border-orange-500/20 text-orange-700'
        }`}>
          <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-lg ${
            isRemoval ? 'bg-rose-500 text-white' : 'bg-orange-500 text-white'
          }`}>
            {isRemoval ? <ShieldAlert className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
          </div>

          <div className="flex-1 space-y-2 text-center md:text-left">
            <h3 className="text-xl font-black tracking-tight">
              {isRemoval ? 'Provider Role Removed' : 'Professional Account Suspended'}
            </h3>
            <p className="text-sm font-medium opacity-80 leading-relaxed max-w-2xl">
              {isRemoval 
                ? `Your professional ${details.previousRole || 'service'} profile has been permanently removed by the administration. You can still use NirogyaSathi as a regular patient.`
                : `Your professional dashboard access has been temporarily suspended due to administrative review.`}
            </p>
            
            <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-4">
              <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-current/10">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(details.date).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-current/10">
                <Clock className="w-3.5 h-3.5" />
                {new Date(details.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {details.reason && (
              <div className="mt-4 p-4 bg-white/40 rounded-2xl border border-current/5 italic text-sm font-medium">
                "Reason: {details.reason}"
              </div>
            )}
          </div>

          <button 
            onClick={() => setIsVisible(false)}
            className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
