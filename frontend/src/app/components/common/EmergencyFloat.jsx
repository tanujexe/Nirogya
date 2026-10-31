import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ambulance, AlertCircle, ChevronRight, Phone } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function EmergencyFloat() {
  const location = useLocation();

  // Don't show on the actual ambulance booking or tracking pages
  if (location.pathname.includes('/ambulance')) return null;

  return (
    <div className="fixed bottom-32 right-4 lg:bottom-8 lg:right-8 z-[5000]">
      <Link to="/ambulance">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative group"
        >
          {/* Outer Pulsing Rings - Softened */}
          <div className="absolute inset-0 bg-red-600 rounded-full lg:rounded-[2rem] blur-xl opacity-10 group-hover:opacity-30 transition-opacity duration-1000 animate-pulse" />
          <div className="absolute -inset-1 bg-red-500/5 rounded-full lg:rounded-[2.5rem] animate-[ping_3s_linear_infinite]" />
          
          <div className="relative bg-red-600 text-white p-2 lg:p-3 rounded-full lg:rounded-3xl shadow-2xl flex items-center gap-3 border border-white/20">
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-white rounded-full lg:rounded-xl flex items-center justify-center shadow-inner shrink-0">
              <Ambulance className="w-4 h-4 lg:w-5 lg:h-5 text-red-600" />
            </div>
            <div className="pr-1 hidden lg:block">
              <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-80 leading-none mb-1">Emergency</p>
              <h3 className="text-base font-black italic tracking-tighter leading-none">AMBULANCE</h3>
            </div>
            <div className="bg-white/20 p-1.5 rounded-lg hidden lg:block">
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
          
          {/* Quick Info Badge - Hidden on mobile to avoid clutter */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 }}
            className="absolute -top-2 -left-2 lg:-top-4 lg:-left-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-2 lg:px-4 py-1 lg:py-2 rounded-full text-[6px] lg:text-[8px] font-black uppercase tracking-widest shadow-xl border border-white/10"
          >
            24/7
          </motion.div>
        </motion.div>
      </Link>
    </div>
  );
}
