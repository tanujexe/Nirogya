import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Stethoscope, RefreshCcw } from 'lucide-react';
import { toast } from 'react-toastify';
import { aiAPI } from '../utils/api';

import SymptomInput from '../components/ai/SymptomInput';
import ReportUpload from '../components/ai/ReportUpload';
import ResultsPanel from '../components/ai/ResultsPanel';
import Loader from '../components/common/Loader';


export default function SymptomCheckerPage() {
  const [activeTab, setActiveTab] = useState('text'); // 'text' or 'report'
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

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
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || 'Network error occurred.';
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
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || 'Network error occurred.';
      toast.error(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFollowUpAnswer = async (answer) => {
    if (!result || !result.session_id) return;
    setIsAnalyzing(true);
    try {
      const response = await aiAPI.followUp({ session_id: result.session_id, answer });
      const resData = response.data;

      if (!resData.success || resData.error) {
        toast.error(resData.error || 'Failed to process answer.');
      } else {
        // Merge updated follow up result
        setResult(resData.data);
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || 'Network error occurred.';
      toast.error(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setResult(null);
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 relative overflow-hidden bg-slate-50 dark:bg-slate-900">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[var(--healthcare-cyan)] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-[var(--healthcare-blue)] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase">
            <span className="text-amber-500">✨</span> AI Diagnostic Assistant
          </div>
        </div>

        <div className="text-center mb-10 relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-extrabold mb-4 text-slate-800 dark:text-white"
          >
            Nirogya Sathi AI
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto"
          >
            Our neural network will identify patterns and suggest next steps.
          </motion.p>
        </div>

        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          {/* INPUT SECTION */}
          <div>
            <div className="flex justify-center gap-2 p-1 bg-white dark:bg-slate-800/50 backdrop-blur-md rounded-full mb-6 border border-slate-200/50 w-fit mx-auto shadow-sm">
              <button 
                onClick={() => { setActiveTab('text'); reset(); }}
                className={`px-6 py-2 text-sm font-bold rounded-full transition-all ${activeTab === 'text' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Text Input
              </button>
              <button 
                onClick={() => { setActiveTab('report'); reset(); }}
                className={`px-6 py-2 text-sm font-bold rounded-full transition-all ${activeTab === 'report' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Lab Report
              </button>
            </div>

            <AnimatePresence mode="wait">
              {isAnalyzing && <Loader fullScreen={true} />}
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

          {/* RESULTS SECTION */}
          {result && (
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
              <ResultsPanel result={result} onFollowUpAnswer={handleFollowUpAnswer} onReset={reset} />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}