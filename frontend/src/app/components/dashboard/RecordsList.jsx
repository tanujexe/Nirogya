import { FileText, Download, Eye, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

const mockRecords = [
  {
    id: '1',
    name: 'Blood Testd Report - CBC',
    type: 'Lab Report',
    date: '2026-04-15',
    size: '1.2 MB',
    doctor: 'Dr. Sarah Johnson',
  },
  {
    id: '2',
    name: 'X-Ray - Chest',
    type: 'Radiology',
    date: '2026-04-10',
    size: '3.5 MB',
    doctor: 'Dr. Michael Chen',
  },
  {
    id: '3',
    name: 'Prescription',
    type: 'Prescription',
    date: '2026-04-08',
    size: '245 KB',
    doctor: 'Dr. Priya Sharma',
  },
  {
    id: '4',
    name: 'Vaccination Record',
    type: 'Immunization',
    date: '2026-03-20',
    size: '180 KB',
  },
];

export default function RecordsList() {
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Health Records</h3>
        <span className="text-sm text-muted-foreground">{mockRecords.length} records</span>
      </div>

      <div className="space-y-3">
        {mockRecords.map((record, index) => (
          <motion.div
            key={record.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-4 bg-accent hover:bg-accent/80 rounded-xl transition-colors group"
          >
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <div className="p-3 bg-[var(--healthcare-blue-light)] dark:bg-[var(--healthcare-blue-light)] rounded-xl group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-[var(--healthcare-blue)]" />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{record.name}</h4>

                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-xs text-muted-foreground">{record.type}</span>

                  <span className="text-xs text-muted-foreground">•</span>

                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(record.date).toLocaleDateString()}</span>
                  </div>

                  {record.doctor && (
                    <>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{record.doctor}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              <button
                className="p-2 rounded-lg hover:bg-[var(--healthcare-blue)]/10 hover:text-[var(--healthcare-blue)] transition-colors"
                title="View"
              >
                <Eye className="w-4 h-4" />
              </button>

              <button
                className="p-2 rounded-lg hover:bg-[var(--healthcare-green)]/10 hover:text-[var(--healthcare-green)] transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {mockRecords.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>

          <p className="text-muted-foreground">No health records yet</p>

          <p className="text-sm text-muted-foreground mt-1">
            Upload your first record to get started
          </p>
        </div>
      )}
    </div>
  );
}