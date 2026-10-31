import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';
import { Activity, ShieldCheck, Zap } from 'lucide-react';

export default function ConfidenceMeter({ confidence = 0, disease = "Analysis" }) {
  const springValue = useSpring(0, { stiffness: 45, damping: 15 });
  const displayValue = useTransform(springValue, (latest) => Math.round(latest));

  useEffect(() => {
    springValue.set(confidence);
  }, [confidence, springValue]);

  const getStatus = (val) => {
    if (val >= 85) return { label: 'High Precision', color: 'text-emerald-500', bg: 'bg-emerald-500', shadow: 'shadow-emerald-500/20' };
    if (val >= 60) return { label: 'Moderate Confidence', color: 'text-[var(--healthcare-cyan)]', bg: 'bg-[var(--healthcare-cyan)]', shadow: 'shadow-[var(--healthcare-cyan)]/20' };
    return { label: 'Low Certainty', color: 'text-amber-500', bg: 'bg-amber-500', shadow: 'shadow-amber-500/20' };
  };

  const status = getStatus(confidence);

  return (
    <div className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-[2.5rem] p-8 shadow-sm group">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className={`p-3 ${status.bg}/10 rounded-2xl transition-colors duration-500`}>
            <Activity className={`w-6 h-6 ${status.color}`} />
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 mb-1">
              Rule-Based Score
            </h4>
            <div className={`text-xs font-bold ${status.color} uppercase tracking-wider`}>
              {status.label}
            </div>
          </div>
        </div>
        <div className="text-right">
          <motion.div 
            key={confidence}
            initial={{ scale: 1.2, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter flex items-end gap-1"
          >
            <motion.span>{displayValue}</motion.span>
            <span className="text-xl text-slate-400 dark:text-slate-500 mb-1.5">%</span>
          </motion.div>
        </div>
      </div>

      <div className="relative h-6 bg-slate-100 dark:bg-slate-900/50 rounded-full p-1.5 overflow-hidden">
        {/* Animated Glow Track */}
        <motion.div 
          className={`absolute inset-0 opacity-20 ${status.bg} blur-xl`}
          initial={{ x: '-100%' }}
          animate={{ x: `${confidence - 100}%` }}
          transition={{ type: 'spring', stiffness: 45, damping: 15 }}
        />
        
        {/* Progress Bar */}
        <motion.div
          className={`h-full rounded-full ${status.bg} relative ${status.shadow} flex items-center justify-end px-2 overflow-hidden`}
          initial={{ width: 0 }}
          animate={{ width: `${confidence}%` }}
          transition={{ type: 'spring', stiffness: 45, damping: 15 }}
        >
          {/* Shimmer Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 translate-x-[-100%] animate-[shimmer_2s_infinite]" />
          
          {confidence > 20 && (
            <Zap className="w-3 h-3 text-white fill-white opacity-80" />
          )}
        </motion.div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex -space-x-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div className={`w-full h-full ${status.bg} opacity-${i * 20}`} />
            </div>
          ))}
        </div>
        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 italic">
          Rule-based clinical pattern ranking (non-diagnostic reference)
        </p>
      </div>
    </div>
  );
}
