import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Search, AlertCircle, CheckCircle2, ArrowRight, ShieldAlert } from 'lucide-react';

const COMMON_SYMPTOMS = [
  'Headache', 'Fever', 'Cough', 'Fatigue', 'Nausea', 'Dizziness', 'Muscle Ache', 'Sore Throat', 'Shortness of Breath', 'Loss of Taste or Smell'
];

export default function SymptomCheckerPage() {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [query, setQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const toggleSymptom = (symptom) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  const handleAnalyze = () => {
    if (selectedSymptoms.length === 0) return;
    setIsAnalyzing(true);
    // Mock analysis delay
    setTimeout(() => {
      setIsAnalyzing(false);
      setResult({
        condition: 'Mild Viral Infection',
        matchPercentage: 85,
        recommendation: 'Rest, hydrate, and monitor your temperature. If symptoms persist for more than 3 days, consult a general physician.',
        severity: 'low',
      });
    }, 2500);
  };

  const reset = () => {
    setSelectedSymptoms([]);
    setResult(null);
  };

  const filteredSymptoms = COMMON_SYMPTOMS.filter(s => 
    s.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[var(--healthcare-cyan)] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-[var(--healthcare-blue)] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 mx-auto bg-gradient-to-br from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-[var(--healthcare-cyan)]/20"
          >
            <Activity className="w-8 h-8 text-white" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Intelligent Symptom Checker
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Select your symptoms and our advanced AI will help identify potential conditions and recommend the next steps.
          </motion.p>
        </div>

        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div 
              key="input-phase"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl"
            >
              <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search symptoms (e.g., headache, fever)..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-background border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--healthcare-cyan)] transition-all text-lg"
                />
              </div>

              <div className="mb-8">
                <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Common Symptoms</h3>
                <div className="flex flex-wrap gap-3">
                  {filteredSymptoms.map((symptom) => {
                    const isSelected = selectedSymptoms.includes(symptom);
                    return (
                      <button
                        key={symptom}
                        onClick={() => toggleSymptom(symptom)}
                        className={`px-4 py-2 rounded-xl border transition-all duration-300 flex items-center space-x-2 ${
                          isSelected 
                            ? 'bg-[var(--healthcare-cyan)] border-[var(--healthcare-cyan)] text-white shadow-lg shadow-[var(--healthcare-cyan)]/30' 
                            : 'bg-background border-border hover:border-[var(--healthcare-cyan)]/50 hover:bg-[var(--healthcare-cyan)]/5'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-4 h-4" />}
                        <span>{symptom}</span>
                      </button>
                    );
                  })}
                  {filteredSymptoms.length === 0 && (
                    <p className="text-muted-foreground text-sm py-2">No symptoms found matching your search.</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-border gap-4">
                <p className="text-muted-foreground">
                  {selectedSymptoms.length} symptom{selectedSymptoms.length !== 1 ? 's' : ''} selected
                </p>
                <button
                  onClick={handleAnalyze}
                  disabled={selectedSymptoms.length === 0 || isAnalyzing}
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[var(--healthcare-cyan)]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 group"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <span>Analyze Symptoms</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result-phase"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4">
                <div>
                  <div className="inline-flex items-center space-x-2 bg-[var(--healthcare-cyan)]/10 text-[var(--healthcare-cyan)] px-3 py-1 rounded-full text-sm font-medium mb-4">
                    <Activity className="w-4 h-4" />
                    <span>Analysis Complete</span>
                  </div>
                  <h2 className="text-3xl font-bold mb-2">Possible Condition</h2>
                  <p className="text-xl text-[var(--healthcare-blue)] font-medium">
                    {result.condition}
                  </p>
                </div>
                <div className="md:text-right bg-background md:bg-transparent p-4 md:p-0 rounded-2xl border md:border-none border-border">
                  <div className="text-4xl font-bold text-[var(--healthcare-cyan)] mb-1">
                    {result.matchPercentage}%
                  </div>
                  <p className="text-sm text-muted-foreground">Match Confidence</p>
                </div>
              </div>

              <div className="bg-background rounded-2xl p-6 border border-border mb-8 flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="bg-blue-500/10 p-3 rounded-xl shrink-0 inline-flex">
                  <AlertCircle className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-lg">Recommendation</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {result.recommendation}
                  </p>
                </div>
              </div>

              <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-4 flex items-start space-x-3 mb-8">
                <ShieldAlert className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <p className="text-sm text-orange-500/90 leading-relaxed">
                  This tool does not provide medical advice. It is intended for informational purposes only. Always consult a healthcare professional for a diagnosis.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-border">
                <button
                  onClick={reset}
                  className="w-full sm:w-auto px-6 py-3 border border-border rounded-xl font-medium hover:bg-accent transition-colors"
                >
                  Check New Symptoms
                </button>
                <button className="w-full flex-1 py-3 bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] text-white rounded-xl font-medium hover:shadow-lg transition-all text-center">
                  Consult a Doctor Now
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}