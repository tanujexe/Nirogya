import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { aiAPI } from '../../utils/api';

export default function VoiceInput({ onTranscription }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lang, setLang] = useState('hi-IN'); // Default to Hindi
  const recognitionRef = useRef(null);
  const onTranscriptionRef = useRef(onTranscription);

  // Update ref whenever onTranscription changes without triggering useEffect
  useEffect(() => {
    onTranscriptionRef.current = onTranscription;
  }, [onTranscription]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = lang; // Uses the selected language

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = async (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join('');

        console.log(`[DEBUG] Voice Raw (${lang}):`, transcript);
        setIsProcessing(true);
        setIsRecording(false);
        try {
          // Send to python backend to normalize hinglish/hindi
          const response = await aiAPI.normalizeInput({ text: transcript });
          const resData = response.data;
          if (resData.success && resData.data.normalized_text) {
            console.log("[DEBUG] Voice Normalized:", resData.data.normalized_text);
            onTranscriptionRef.current(resData.data.normalized_text);
          } else {
            onTranscriptionRef.current(transcript);
          }
        } catch (error) {
          console.error("Normalization error:", error);
          onTranscriptionRef.current(transcript); // fallback to raw
        } finally {
          setIsProcessing(false);
        }
      };

      recognition.onerror = (event) => {
        setIsRecording(false);
        if (event.error !== 'aborted') {
          toast.error(`Voice error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [lang]); // Re-run when language changes

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast.error('Voice input is not supported in your browser.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    return null; // Don't render if not supported
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setLang(prev => prev === 'hi-IN' ? 'en-IN' : 'hi-IN')}
        className="text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors uppercase tracking-tighter"
        title="Switch Language"
      >
        {lang === 'hi-IN' ? 'HI' : 'EN'}
      </button>

      <button
        type="button"
        onClick={toggleRecording}
        disabled={isProcessing}
        className={`p-3 rounded-full transition-all flex items-center justify-center ${
          isRecording 
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/30' 
            : 'bg-accent border border-border hover:border-[var(--healthcare-cyan)] text-foreground'
        }`}
        title={`Voice Input (${lang === 'hi-IN' ? 'Hindi' : 'English'})`}
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isRecording ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}
