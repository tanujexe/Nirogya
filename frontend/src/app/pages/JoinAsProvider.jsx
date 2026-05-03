import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  Stethoscope, 
  Ambulance, 
  Droplets, 
  FlaskConical, 
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  Clock
} from 'lucide-react';

const providerTypes = [
  {
    id: 'doctor',
    title: 'Doctor Partner',
    description: 'Join our network of elite medical professionals and grow your practice.',
    icon: Stethoscope,
    color: 'from-cyan-500 to-blue-500',
    benefits: ['Smart Appointment System', 'Digital Health Records', 'Profile Analytics'],
    path: '/onboarding/doctor'
  },
  {
    id: 'ambulance',
    title: 'Ambulance Provider',
    description: 'Connect your emergency services with patients in need of rapid response.',
    icon: Ambulance,
    color: 'from-red-500 to-orange-500',
    benefits: ['Live Emergency Alerts', 'Service Zone Management', 'Fleet Monitoring'],
    path: '/onboarding/ambulance'
  },
  {
    id: 'bloodbank',
    title: 'Blood Bank Partner',
    description: 'Manage your blood stock efficiently and save lives through timely supply.',
    icon: Droplets,
    color: 'from-rose-500 to-red-600',
    benefits: ['Inventory Management', 'Urgent Request Tracking', 'Verified Badge'],
    path: '/onboarding/bloodbank'
  },
  {
    id: 'lab',
    title: 'Diagnostic Lab',
    description: 'Offer your diagnostic services and tests to a wider digital audience.',
    icon: FlaskConical,
    color: 'from-emerald-500 to-teal-600',
    benefits: ['Digital Report Delivery', 'Test Category Management', 'Home Collection Flow'],
    path: '/onboarding/lab'
  }
];

export default function JoinAsProvider() {
  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--healthcare-cyan)]/5 rounded-full blur-3xl -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[var(--healthcare-blue)]/5 rounded-full blur-3xl -ml-64 -mb-64" />
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--healthcare-cyan)]/10 text-[var(--healthcare-cyan)] rounded-full mb-6"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="text-sm font-bold uppercase tracking-widest">Nirogya Provider Network</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black mb-6"
          >
            Empower Your <span className="bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] bg-clip-text text-transparent">Healthcare Service</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Join India's most advanced healthcare ecosystem. Choose your category and start your professional journey with us today.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {providerTypes.map((type, index) => (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ y: -10 }}
              className="bg-card border border-border rounded-3xl p-8 flex flex-col hover:shadow-2xl hover:shadow-[var(--healthcare-cyan)]/10 transition-all group"
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${type.color} flex items-center justify-center text-white mb-6 shadow-lg shadow-black/10 group-hover:scale-110 transition-transform duration-500`}>
                <type.icon className="w-8 h-8" />
              </div>
              
              <h3 className="text-2xl font-bold mb-4">{type.title}</h3>
              <p className="text-sm text-muted-foreground mb-8 flex-1 leading-relaxed">
                {type.description}
              </p>
              
              <ul className="space-y-3 mb-8">
                {type.benefits.map((benefit, bIdx) => (
                  <li key={bIdx} className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--healthcare-cyan)]" />
                    {benefit}
                  </li>
                ))}
              </ul>
              
              <Link
                to={type.path}
                className="inline-flex items-center justify-center gap-2 w-full py-4 bg-accent hover:bg-[var(--healthcare-cyan)] hover:text-white rounded-2xl font-bold transition-all group/btn"
              >
                <span>Apply Now</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Why Join Section */}
        <div className="grid md:grid-cols-3 gap-12 bg-card/50 border border-border rounded-[40px] p-12 backdrop-blur-xl">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--healthcare-cyan)]/10 flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 text-[var(--healthcare-cyan)]" />
            </div>
            <div>
              <h4 className="text-xl font-bold mb-2">Fast Onboarding</h4>
              <p className="text-sm text-muted-foreground">Quick and seamless verification process to get you started in no time.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--healthcare-blue)]/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6 text-[var(--healthcare-blue)]" />
            </div>
            <div>
              <h4 className="text-xl font-bold mb-2">Growth Analytics</h4>
              <p className="text-sm text-muted-foreground">Comprehensive insights and dashboards to track and grow your services.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h4 className="text-xl font-bold mb-2">24/7 Connectivity</h4>
              <p className="text-sm text-muted-foreground">Stay connected with your patients and manage requests anytime, anywhere.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
