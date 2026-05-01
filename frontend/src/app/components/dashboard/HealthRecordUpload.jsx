import { useState, useRef } from 'react';
import { Upload, FileText, X, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'react-toastify';

export default function HealthRecordUpload() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setUploading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    toast.success(`${files.length} file(s) uploaded successfully!`);
    setFiles([]);
    setUploading(false);
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-4">Upload Health Records</h3>

      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-[var(--healthcare-cyan)] hover:bg-accent/50 transition-all group"
      >
        <div className="flex flex-col items-center space-y-3">
          <div className="p-4 rounded-full bg-[var(--healthcare-cyan-light)] dark:bg-[var(--healthcare-cyan-light)] group-hover:scale-110 transition-transform">
            <Upload className="w-8 h-8 text-[var(--healthcare-cyan)]" />
          </div>

          <div>
            <p className="font-medium mb-1">Click to upload or drag and drop</p>
            <p className="text-sm text-muted-foreground">
              PDF, JPG, PNG up to 10MB each
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 space-y-2"
        >
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-accent rounded-xl"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[var(--healthcare-cyan-light)] dark:bg-[var(--healthcare-cyan-light)] rounded-lg">
                  <FileText className="w-5 h-5 text-[var(--healthcare-cyan)]" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              <button
                onClick={() => removeFile(index)}
                className="p-1 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full py-3 px-4 mt-4 rounded-xl bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {uploading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Upload className="w-5 h-5" />
                </motion.div>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>Upload {files.length} File{files.length !== 1 ? 's' : ''}</span>
              </>
            )}
          </button>
        </motion.div>
      )}
    </div>
  );
}