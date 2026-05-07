import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, FileText, Check, Loader2, Hospital, Calendar, Tag, Info } from 'lucide-react';
import { toast } from 'react-toastify';
import { healthRecordsAPI } from '../../utils/api';

const categories = [
  'MRI', 'CT Scan', 'X-Ray', 'Blood Test', 'Prescription', 'ECG', 'Ultrasound', 'Other'
];

export default function UploadModal({ isOpen, onClose, onUploadSuccess, initialData = null }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialData || {
    title: '',
    category: 'Other',
    hospitalName: '',
    reportDate: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const isEdit = !!initialData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEdit && !file) {
      toast.error('Please select a report file');
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await healthRecordsAPI.update(initialData._id, formData);
        toast.success('Report updated successfully');
      } else {
        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        data.append('file', file);
        await healthRecordsAPI.upload(data);
        toast.success('Report uploaded successfully');
      }
      onUploadSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-border flex justify-between items-center bg-gradient-to-r from-[var(--healthcare-cyan)]/5 to-[var(--healthcare-blue)]/5">
            <div>
              <h2 className="text-2xl font-bold">{isEdit ? 'Edit Report' : 'Upload New Report'}</h2>
              <p className="text-sm text-muted-foreground">Securely store your medical documents</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-xl transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {!isEdit && (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all group ${
                  file ? 'border-green-500 bg-green-500/5' : 'border-border hover:border-[var(--healthcare-cyan)] hover:bg-accent'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <div className="flex flex-col items-center gap-3">
                  <div className={`p-4 rounded-full transition-transform group-hover:scale-110 ${
                    file ? 'bg-green-500/20 text-green-600' : 'bg-[var(--healthcare-cyan)]/10 text-[var(--healthcare-cyan)]'
                  }`}>
                    {file ? <Check className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                  </div>
                  {file ? (
                    <div>
                      <p className="font-semibold text-green-600">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold">Click to select report file</p>
                      <p className="text-sm text-muted-foreground">PDF, JPEG, PNG (Max 10MB)</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--healthcare-cyan)]" /> Report Title
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Brain MRI - Full Scan"
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-[var(--healthcare-cyan)] outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[var(--healthcare-cyan)]" /> Category
                </label>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-[var(--healthcare-cyan)] outline-none transition-all appearance-none"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Hospital className="w-4 h-4 text-[var(--healthcare-cyan)]" /> Hospital/Lab Name
                </label>
                <input
                  type="text"
                  name="hospitalName"
                  value={formData.hospitalName}
                  onChange={handleChange}
                  placeholder="e.g. Apollo Hospitals"
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-[var(--healthcare-cyan)] outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[var(--healthcare-cyan)]" /> Report Date
                </label>
                <input
                  type="date"
                  name="reportDate"
                  required
                  value={formData.reportDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-[var(--healthcare-cyan)] outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Info className="w-4 h-4 text-[var(--healthcare-cyan)]" /> Additional Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                placeholder="Add any specific observations or doctor comments..."
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-[var(--healthcare-cyan)] outline-none transition-all resize-none"
              ></textarea>
            </div>

            <div className="pt-4 flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 rounded-2xl border border-border font-bold hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] text-white font-bold hover:shadow-lg hover:shadow-[var(--healthcare-cyan)]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{isEdit ? 'Updating...' : 'Uploading...'}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>{isEdit ? 'Save Changes' : 'Complete Upload'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
