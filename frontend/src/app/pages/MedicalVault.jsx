import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Plus, Filter, Grid, List, 
  ShieldCheck, ArrowRight, Loader2,
  FileX, SearchX, Inbox
} from 'lucide-react';
import { healthRecordsAPI } from '../utils/api';
import VaultCard from '../components/vault/VaultCard';
import UploadModal from '../components/vault/UploadModal';
import { toast } from 'react-toastify';

const categories = [
  'All', 'MRI', 'CT Scan', 'X-Ray', 'Blood Test', 'Prescription', 'ECG', 'Ultrasound', 'Other'
];

export default function MedicalVault() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewType, setViewType] = useState('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data } = await healthRecordsAPI.getAll();
      setReports(data.data);
    } catch (error) {
      toast.error('Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      await healthRecordsAPI.delete(id);
      toast.success('Report deleted');
      fetchReports();
    } catch (error) {
      toast.error('Failed to delete report');
    }
  };

  const handleEdit = (report) => {
    setEditingReport({
      ...report,
      reportDate: report.reportDate ? new Date(report.reportDate).toISOString().split('T')[0] : ''
    });
    setIsModalOpen(true);
  };

  const handleView = (report) => {
    window.open(report.fileUrl, '_blank');
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          report.hospitalName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || report.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen pt-28 pb-16 px-4 sm:px-6 lg:px-8 bg-[var(--background)]">
      <div className="max-w-7xl mx-auto">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-2 text-[var(--healthcare-cyan)] mb-2">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-widest">Smart Medical Vault</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              Manage Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)]">Health Records</span>
            </h1>
            <p className="text-muted-foreground mt-3 text-lg max-w-xl">
              Securely store, organize, and selectively share your medical reports with healthcare professionals.
            </p>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setEditingReport(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] text-white rounded-2xl font-bold shadow-xl shadow-[var(--healthcare-cyan)]/20 hover:shadow-2xl hover:shadow-[var(--healthcare-cyan)]/30 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Upload New Report</span>
          </motion.button>
        </div>

        {/* Filters & Search */}
        <div className="bg-card/50 backdrop-blur-xl border border-border rounded-3xl p-6 mb-8 flex flex-col lg:flex-row gap-6 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input 
              type="text"
              placeholder="Search by report title or hospital..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-[var(--healthcare-cyan)] outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar w-full lg:w-auto">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap border transition-all ${
                  selectedCategory === cat 
                    ? 'bg-[var(--healthcare-cyan)] border-[var(--healthcare-cyan)] text-white shadow-lg shadow-[var(--healthcare-cyan)]/20' 
                    : 'bg-muted/50 border-border hover:bg-muted text-muted-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex bg-muted/50 p-1.5 rounded-xl border border-border self-stretch lg:self-auto">
            <button 
              onClick={() => setViewType('grid')}
              className={`p-2 rounded-lg transition-all ${viewType === 'grid' ? 'bg-card shadow-sm text-[var(--healthcare-cyan)]' : 'text-muted-foreground'}`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewType('list')}
              className={`p-2 rounded-lg transition-all ${viewType === 'list' ? 'bg-card shadow-sm text-[var(--healthcare-cyan)]' : 'text-muted-foreground'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-12 h-12 text-[var(--healthcare-cyan)] animate-spin" />
            <p className="text-muted-foreground font-medium animate-pulse">Accessing your secure vault...</p>
          </div>
        ) : filteredReports.length > 0 ? (
          <motion.div 
            layout
            className={viewType === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "flex flex-col gap-4"
            }
          >
            <AnimatePresence>
              {filteredReports.map(report => (
                <VaultCard 
                  key={report._id} 
                  report={report} 
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                  viewType={viewType}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 text-center bg-card/30 border border-dashed border-border rounded-3xl"
          >
            <div className="p-6 rounded-full bg-muted mb-6">
              {searchQuery ? <SearchX className="w-12 h-12 text-muted-foreground" /> : <Inbox className="w-12 h-12 text-muted-foreground" />}
            </div>
            <h3 className="text-2xl font-bold mb-2">
              {searchQuery ? 'No results found' : 'Your vault is empty'}
            </h3>
            <p className="text-muted-foreground max-w-sm mb-8 text-lg">
              {searchQuery 
                ? `We couldn't find any reports matching "${searchQuery}". Try a different term.`
                : 'Start building your digital medical history by uploading your first report today.'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 text-[var(--healthcare-cyan)] font-bold hover:underline"
              >
                <span>Upload your first report</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        )}
      </div>

      <UploadModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingReport(null);
        }}
        onUploadSuccess={fetchReports}
        initialData={editingReport}
      />
    </div>
  );
}
