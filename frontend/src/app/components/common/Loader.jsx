import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, Activity, ShieldCheck, Zap } from "lucide-react";

const medicalTips = [
  "Analyzing medical data securely...",
  "Syncing with neural diagnostic networks...",
  "Encrypting patient privacy layers...",
  "Consulting digital health patterns...",
  "Verifying laboratory integrity..."
];

export default function Loader({ fullScreen = false }) {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % medicalTips.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const content = (
    <div className={`flex flex-col items-center justify-center gap-8 ${fullScreen ? 'fixed inset-0 z-[9999] bg-white dark:bg-slate-950' : 'min-h-[400px]'}`}>
      {/* Animated Background Gradients (only if full screen) */}
      {fullScreen && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--healthcare-cyan)]/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--healthcare-blue)]/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      )}

      <div className="relative flex flex-col items-center space-y-8 z-10">
        {/* Main Logo Animation */}
        <div className="relative">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-24 h-24 bg-gradient-to-br from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] rounded-[32px] flex items-center justify-center shadow-2xl shadow-cyan-500/20 relative z-20"
          >
            <Heart className="w-10 h-10 text-white" fill="white" />
          </motion.div>
          
          {/* Outer Ring */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-12px] border-2 border-dashed border-cyan-500/20 rounded-[40px] z-10"
          />
        </div>

        {/* Morphing Dot Animation */}
        <div className="flex space-x-2">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3],
                borderRadius: ["20%", "50%", "20%"]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="w-3 h-3 bg-[var(--healthcare-cyan)]"
            />
          ))}
        </div>

        {/* Text Section */}
        <div className="text-center space-y-3">
          <motion.h3 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-xl font-black tracking-tight text-slate-800 dark:text-white uppercase"
          >
            Nirogya Sathi
          </motion.h3>
          
          <div className="h-6">
            <AnimatePresence mode="wait">
              <motion.p
                key={tipIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2"
              >
                {tipIndex % 2 === 0 ? <ShieldCheck className="w-4 h-4 text-emerald-500" /> : <Zap className="w-4 h-4 text-amber-500" />}
                {medicalTips[tipIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Premium Footer Text */}
      {fullScreen && (
        <div className="absolute bottom-12 text-center w-full">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Advanced Medical Intelligence Platform</p>
        </div>
      )}
    </div>
  );

  return content;
}