import { AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

export default function ErrorMessage({
  message = 'Something went wrong',
  onRetry,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center min-h-[400px] px-4"
    >
      <div className="max-w-md w-full bg-destructive/5 border border-destructive/20 rounded-2xl p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>

        <h3 className="text-lg font-semibold mb-2">Error</h3>

        <p className="text-muted-foreground mb-6">{message}</p>

        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-lg bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] text-white hover:shadow-lg transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}