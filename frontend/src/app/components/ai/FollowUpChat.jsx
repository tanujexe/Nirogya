import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, CheckCircle2, Circle, HelpCircle } from 'lucide-react';

export default function FollowUpChat({ followUpData, onAnswer }) {
  const [answer, setAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Reset internal state when a new question arrives
    setAnswer('');
    setSelectedOption(null);
  }, [followUpData?.question]);

  if (!followUpData || !followUpData.needs_follow_up || !followUpData.question) {
    return null;
  }

  const handleSend = (finalAnswer) => {
    const val = finalAnswer || answer || selectedOption;
    if (!val || (typeof val === 'string' && !val.trim())) return;
    onAnswer(val);
  };

  const renderInput = () => {
    const type = followUpData.type || 'text';
    const options = followUpData.options || [];

    if (type === 'radio' || type === 'yesno' || options.length > 0) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {options.map((opt, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSend(opt)}
              className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl hover:border-[var(--healthcare-cyan)] hover:shadow-lg hover:shadow-[var(--healthcare-cyan)]/5 transition-all text-left group"
            >
              <div className="w-5 h-5 rounded-full border-2 border-slate-400 dark:border-slate-600 flex items-center justify-center group-hover:border-[var(--healthcare-cyan)] transition-colors">
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--healthcare-cyan)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="font-semibold text-slate-900 dark:text-slate-200">{opt}</span>
            </motion.button>
          ))}
        </div>
      );
    }

    return (
      <div className="flex gap-2 mt-4">
        <input
          ref={inputRef}
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder="Type your answer here..."
          className="flex-1 px-5 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--healthcare-cyan)] transition-all dark:text-white"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleSend()}
          disabled={!answer.trim()}
          className="px-6 py-4 bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] text-white rounded-2xl font-bold hover:shadow-xl hover:shadow-[var(--healthcare-blue)]/20 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          <Send className="w-5 h-5" />
          <span className="hidden sm:inline">Send</span>
        </motion.button>
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-6 md:p-8 mb-8 relative overflow-hidden"
    >
      {/* Decorative background element */}
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[var(--healthcare-cyan)] opacity-5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-[var(--healthcare-cyan)]/10 rounded-2xl">
          <MessageSquare className="w-6 h-6 text-[var(--healthcare-cyan)]" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5">Refining Prediction</h4>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Interactive Follow-up</h3>
        </div>
      </div>

      <div className="relative mb-6">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--healthcare-cyan)] rounded-full opacity-30" />
        <div className="pl-6 py-2">
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
            {followUpData.question}
          </p>
          {followUpData.hint && (
            <div className="flex items-start gap-2 mt-3 text-sm text-slate-600 dark:text-slate-400 italic">
              <HelpCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{followUpData.hint}</span>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={followUpData.question}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderInput()}
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span>Real-time Neural Analysis active</span>
        </div>
        <p>Your data stays private and encrypted</p>
      </div>
    </motion.div>
  );
}
