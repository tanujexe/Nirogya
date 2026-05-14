import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Send } from 'lucide-react';
import { toast } from 'react-toastify';
import VoiceInput from './VoiceInput';

export default function SymptomInput({ onAnalyze, isAnalyzing }) {
  const [text, setText] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [spo2, setSpo2] = useState('');

  const handleAnalyze = useCallback(() => {
    if (text.trim().length < 3) {
      toast.info('Please describe your symptoms in more detail (at least 3 characters).');
      return;
    }

    onAnalyze({
      text,
      age: age ? Number(age) : null,
      gender,
      spo2: spo2 ? Number(spo2) : null,
    });
  }, [onAnalyze, text, age, gender, spo2]);

  const handleVoiceInput = useCallback((voiceText) => {
    setText((prev) => (prev ? prev + ' ' + voiceText : voiceText));
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAnalyze();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[24px] p-6 shadow-sm mb-8 relative">

      <div className="mb-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your symptoms (e.g. I have chest pain, shortness of breath...)"
          className="w-full min-h-[140px] p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-600 transition-all resize-y text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setText('severe headache, stiff neck, high fever 39.5°C, confusion. Age 28, HR 115 bpm')} className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-full transition-colors font-medium">🤧 Cold / Flu</button>
        <button onClick={() => setText('chest pain radiating to left arm, cold sweats, shortness of breath. Age 52, HR 130')} className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-full transition-colors font-medium">🫀 Cardiac Emergency</button>
        <button onClick={() => setText('one sided weakness, difficulty speaking, confused. Age 65')} className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-full transition-colors font-medium">🧠 Stroke Signs</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Age</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="e.g. 35"
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Gender</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
          >
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">SpO2 %</label>
          <input
            type="number"
            value={spo2}
            onChange={(e) => setSpo2(e.target.value)}
            placeholder="e.g. 98"
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <div className="ml-2">
            <VoiceInput onTranscription={handleVoiceInput} />
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !text.trim()}
          className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <span>Analyze Now</span>
              <Send className="w-3.5 h-3.5 ml-1" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}