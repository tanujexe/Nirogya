import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Stethoscope, RefreshCcw, Sparkles } from 'lucide-react';
import { toast } from 'react-toastify';
import { aiAPI } from '../utils/api';

import SymptomInput from '../components/ai/SymptomInput';
import ReportUpload from '../components/ai/ReportUpload';
import ResultsPanel from '../components/ai/ResultsPanel';
import DiagnosticSkeleton from '../components/ai/DiagnosticSkeleton';
import Loader from '../components/common/Loader';


export default function SymptomCheckerPage() {
  const [activeTab, setActiveTab] = useState('text'); // 'text' or 'report'
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [result, setResult] = useState(null);
  const resultsRef = useRef(null);

  const handleAnalyzeText = async (data) => {
    setIsAnalyzing(true);
    setResult(null);
    try {
      const response = await aiAPI.predict(data);
      const resData = response.data;
      
      if (!resData.success || resData.error) {
        toast.error(resData.error || 'Failed to analyze symptoms.');
      } else {
        setResult(resData.data);
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || 'Network error occurred. Please check your connection.';
      toast.error(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeReport = async (formData) => {
    setIsAnalyzing(true);
    setResult(null);
    try {
      const response = await aiAPI.analyzeReport(formData);
      const resData = response.data;

      if (!resData.success || resData.error) {
        toast.error(resData.error || 'Failed to analyze report.');
      } else {
        setResult(resData.data);
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || 'Network error occurred during report analysis.';
      toast.error(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFollowUpAnswer = async (answer) => {
    if (!result || !result.session_id) return;
    setIsRecalculating(true);
    try {
      const response = await aiAPI.followUp({ session_id: result.session_id, answer });
      const resData = response.data;

      if (!resData.success || resData.error) {
        toast.error(resData.error || 'Failed to process your answer.');
      } else {
        setResult(resData.data);
        // Scroll to results to show the updated confidence
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || 'Failed to update prediction. Please try again.';
      toast.error(msg);
    } finally {
      setIsRecalculating(false);
    }
  };

  const reset = () => {
    setResult(null);
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 relative overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-500">
      {/* Premium Mesh Background Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40 dark:opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-emerald-400/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-violet-400/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex justify-center mb-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-5 py-2 rounded-full text-[10px] font-black tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            NirogyaSathi Neural Diagnostics
          </motion.div>
        </div>

        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-black mb-6 text-slate-900 dark:text-white tracking-tighter"
          >
            AI Medical <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-400 font-black">Expert</span>
          </motion.h1>
            <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            Advanced diagnostic intelligence for immediate health assessments and laboratory analysis.
          </motion.p>
        </div>

        <div className="max-w-4xl mx-auto space-y-12">
          {/* INPUT SELECTION */}
          <div className="relative">
            <div className="flex justify-center gap-2 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2rem] mb-10 w-fit mx-auto shadow-2xl">
              <button 
                onClick={() => { setActiveTab('text'); reset(); }}
                className={`px-8 py-3 text-xs font-black uppercase tracking-widest rounded-[1.5rem] transition-all duration-300 ${activeTab === 'text' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
              >
                Symptom Analysis
              </button>
              <button 
                onClick={() => { setActiveTab('report'); reset(); }}
                className={`px-8 py-3 text-xs font-black uppercase tracking-widest rounded-[1.5rem] transition-all duration-300 ${activeTab === 'report' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
              >
                Lab Intelligence
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'text' ? (
                <motion.div key="text" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <SymptomInput onAnalyze={handleAnalyzeText} isAnalyzing={isAnalyzing} />
                </motion.div>
              ) : (
                <motion.div key="report" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <ReportUpload onAnalyze={handleAnalyzeReport} isAnalyzing={isAnalyzing} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* LOADING & RESULTS SECTION */}
          <div ref={resultsRef} className="scroll-mt-24">
            <AnimatePresence mode="wait">
              {isAnalyzing ? (
                <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <DiagnosticSkeleton />
                </motion.div>
              ) : result ? (
                <motion.div key="results" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="relative">
                  <AnimatePresence>
                    {isRecalculating && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-white/10 dark:bg-slate-950/10 backdrop-blur-[1px] rounded-[3rem] flex flex-col items-center justify-center pointer-events-none">
                        <div className="bg-white/90 dark:bg-slate-900/90 p-6 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 flex items-center gap-4">
                          <RefreshCcw className="w-6 h-6 text-[var(--healthcare-cyan)] animate-spin" />
                          <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Updating Analysis...</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <ResultsPanel result={result} onFollowUpAnswer={handleFollowUpAnswer} onReset={reset} />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}