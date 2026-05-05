import { motion } from 'motion/react';
import { FileText, Calendar, Hospital, MoreVertical, ExternalLink, Trash2, Edit2 } from 'lucide-react';
import { format } from 'date-fns';

export default function VaultCard({ report, onEdit, onDelete, onView }) {
  const getCategoryColor = (category) => {
    const colors = {
      'MRI': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      'CT Scan': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      'X-Ray': 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
      'Blood Test': 'bg-red-500/10 text-red-500 border-red-500/20',
      'Prescription': 'bg-green-500/10 text-green-500 border-green-500/20',
      'ECG': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      'Ultrasound': 'bg-pink-500/10 text-pink-500 border-pink-500/20',
      'Other': 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    };
    return colors[category] || colors['Other'];
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5 }}
      className="bg-card border border-border rounded-2xl p-5 hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
    >
      {/* Glassmorphism Background Effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--healthcare-cyan)]/5 to-transparent rounded-bl-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500" />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getCategoryColor(report.category)}`}>
          {report.category}
        </div>
        
        <div className="flex gap-1">
          <a 
            href={report.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-[var(--healthcare-cyan)] transition-colors flex items-center justify-center"
            title="View Report"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button 
            onClick={() => onEdit(report)}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-[var(--healthcare-blue)] transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(report._id)}
            className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3 relative z-10">
        <a 
          href={report.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block group-hover:no-underline"
        >
          <h3 className="font-bold text-lg leading-tight group-hover:text-[var(--healthcare-cyan)] transition-colors line-clamp-1">
            {report.title}
          </h3>
        </a>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Hospital className="w-4 h-4 text-[var(--healthcare-cyan)]" />
            <span className="line-clamp-1">{report.hospitalName || 'Unknown Hospital'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 text-[var(--healthcare-cyan)]" />
            <span>{report.reportDate ? format(new Date(report.reportDate), 'PPP') : 'N/A'}</span>
          </div>
        </div>

        {report.notes && (
          <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg line-clamp-2">
            {report.notes}
          </p>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-border/50 flex items-center justify-between relative z-10">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">
          Uploaded {format(new Date(report.createdAt), 'MMM d, yyyy')}
        </span>
        <div className="w-8 h-8 rounded-lg bg-[var(--healthcare-cyan)]/10 flex items-center justify-center">
          <FileText className="w-4 h-4 text-[var(--healthcare-cyan)]" />
        </div>
      </div>
    </motion.div>
  );
}
