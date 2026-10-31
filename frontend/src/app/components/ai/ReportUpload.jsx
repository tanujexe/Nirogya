import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, X } from 'lucide-react';
import { toast } from 'react-toastify';

export default function ReportUpload({ onAnalyze, isAnalyzing }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile) => {
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Invalid file type. Please upload JPG, PNG, or PDF.');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File is too large. Maximum size is 10MB.');
      return;
    }
    setFile(selectedFile);
  };

  const submitAnalysis = () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    if (age) formData.append('age', age);
    if (gender) formData.append('gender', gender);
    if (dob) formData.append('dob', dob);
    onAnalyze(formData);
  };

  return (
    <div className="bg-card/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 md:p-8 shadow-2xl mb-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[var(--healthcare-blue)] to-transparent opacity-5 pointer-events-none rounded-full blur-3xl"></div>

      <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
        <div className="p-2 bg-[var(--healthcare-blue)]/10 rounded-xl">
          <FileText className="w-6 h-6 text-[var(--healthcare-blue)]" />
        </div>
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
          Lab Report Analysis
        </span>
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        Upload a blood test, CBC, or general lab report. Our AI will extract values and flag abnormalities.
      </p>

      <div
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-[var(--healthcare-cyan)] bg-[var(--healthcare-cyan)]/5'
            : 'border-border hover:border-[var(--healthcare-cyan)]/50 hover:bg-accent/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".jpg,.jpeg,.png,.pdf,.webp"
          className="hidden"
        />
        
        {file ? (
          <div className="flex items-center justify-center gap-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
            <div className="text-left">
              <p className="font-medium truncate max-w-[200px] md:max-w-xs">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="p-1 hover:bg-red-500/10 hover:text-red-500 rounded-full transition-colors ml-4"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-medium mb-1">Drag & drop or click to upload</p>
            <p className="text-xs text-muted-foreground">JPG, PNG, or PDF up to 10MB</p>
          </div>
        )}
      </div>

      {/* Patient Demographics (Optional for age/sex-specific reference intervals) */}
      <div className="mt-6 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Patient Demographics (Optional)
          </span>
          <span className="text-[10px] text-muted-foreground/70">
            For precision pediatric, adult & sex-specific intervals
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] text-muted-foreground mb-1 font-medium">Age (years)</label>
            <input
              type="number"
              min="0"
              max="125"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 28"
              className="w-full px-3 py-2 text-sm rounded-xl bg-background border border-border focus:outline-none focus:ring-1 focus:ring-[var(--healthcare-cyan)] text-foreground"
            />
          </div>
          <div>
            <label className="block text-[11px] text-muted-foreground mb-1 font-medium">Biological Sex</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl bg-background border border-border focus:outline-none focus:ring-1 focus:ring-[var(--healthcare-cyan)] text-foreground"
            >
              <option value="">Auto / Unspecified</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-muted-foreground mb-1 font-medium">Date of Birth</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl bg-background border border-border focus:outline-none focus:ring-1 focus:ring-[var(--healthcare-cyan)] text-foreground"
            />
          </div>
        </div>
      </div>

      <button
        onClick={submitAnalysis}
        disabled={isAnalyzing || !file}
        className="w-full mt-8 py-4 bg-gradient-to-r from-[var(--healthcare-cyan)] via-blue-500 to-[var(--healthcare-blue)] text-white rounded-2xl font-bold text-lg hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[var(--healthcare-blue)]/30 transition-all disabled:opacity-50 flex items-center justify-center gap-3 transform hover:-translate-y-0.5 active:translate-y-0"
      >
        {isAnalyzing ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Processing Report...</span>
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            <span>Analyze Report</span>
          </>
        )}
      </button>
    </div>
  );
}
