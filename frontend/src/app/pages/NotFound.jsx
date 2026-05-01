import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Stethoscope, Home, ArrowLeft, HeartPulse } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 relative overflow-hidden bg-muted/5">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--healthcare-cyan)]/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--healthcare-blue)]/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-2xl w-full text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="relative inline-block">
             <div className="absolute inset-0 bg-gradient-to-br from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] rounded-full blur-3xl opacity-20 animate-pulse" />
             <div className="relative bg-card border border-border w-32 h-32 md:w-48 md:h-48 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                <Stethoscope className="w-16 h-16 md:w-24 md:h-24 text-[var(--healthcare-cyan)]" strokeWidth={1.5} />
             </div>
             
             <motion.div 
               animate={{ rotate: [0, 10, -10, 0] }}
               transition={{ repeat: Infinity, duration: 4 }}
               className="absolute -top-2 -right-2 bg-white p-4 rounded-2xl shadow-xl border border-border"
             >
                <HeartPulse className="w-8 h-8 text-red-500" />
             </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-8xl md:text-[12rem] font-black text-transparent bg-clip-text bg-gradient-to-br from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] leading-none mb-4">
            404
          </h1>
          
          <h2 className="text-3xl md:text-4xl font-black mb-6">Page Not Found</h2>
          
          <p className="text-lg text-muted-foreground mb-12 max-w-lg mx-auto">
            Oops! It seems like the page you are looking for has been misplaced. 
            Let's get you back to the right path for your health journey.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] text-white rounded-2xl font-black shadow-xl shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Return Home
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="w-full sm:w-auto px-8 py-4 bg-card border border-border rounded-2xl font-black hover:bg-muted transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </button>
          </div>
        </motion.div>

        {/* Diagnostic Links */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 pt-8 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-4"
        >
           <QuickLink to="/doctors" label="Find Doctors" />
           <QuickLink to="/hospitals" label="Hospitals" />
           <QuickLink to="/lab-tests" label="Lab Tests" />
           <QuickLink to="/symptom-checker" label="Health Check" />
        </motion.div>
      </div>
    </div>
  );
}

function QuickLink({ to, label }) {
  return (
    <Link to={to} className="text-sm font-bold text-muted-foreground hover:text-[var(--healthcare-cyan)] transition-colors">
      {label}
    </Link>
  )
}
