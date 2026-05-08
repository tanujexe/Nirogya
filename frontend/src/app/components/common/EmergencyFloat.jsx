import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ambulance, AlertCircle, ChevronRight, Phone } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function EmergencyFloat() {
  const location = useLocation();

  // Don't show on the actual ambulance booking or tracking pages
  if (location.pathname.includes('/ambulance')) return null;

  return (
    <div className="fixed bottom-8 right-8 z-[5000]">
      <Link to="/ambulance">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative group"
        >
          {/* Outer Pulsing Rings */}
          <div className="absolute inset-0 bg-red-600 rounded-[2rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity animate-pulse" />
          <div className="absolute -inset-2 bg-red-500/10 rounded-[2.5rem] animate-ping" />
          
          <div className="relative bg-red-600 text-white p-5 rounded-[2rem] shadow-2xl flex items-center gap-4 border border-white/20">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-inner shrink-0">
              <Ambulance className="w-7 h-7 text-red-600" />
            </div>
            <div className="pr-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 leading-none mb-1">Emergency</p>
              <h3 className="text-xl font-black italic tracking-tighter leading-none">AMBULANCE</h3>
            </div>
            <div className="bg-white/20 p-2 rounded-xl">
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
          
          {/* Quick Info Badge */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 }}
            className="absolute -top-4 -left-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl border border-white/10"
          >
            24/7 LIVE
          </motion.div>
        </motion.div>
      </Link>
    </div>
  );
}
