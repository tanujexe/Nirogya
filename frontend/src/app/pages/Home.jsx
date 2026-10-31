import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Stethoscope, Calendar, FileText, Heart, Users, Award,
  Shield, Clock, Star, ArrowRight, Activity, Sparkles
} from 'lucide-react';
import { doctorsAPI } from '../utils/api';
import DoctorCard from '../components/doctors/DoctorCard';
import { useAuth } from '../context/AuthContext';
import heroCute from '../../assets/hero-cute.png';

export default function Home() {
  const [featuredDoctors, setFeaturedDoctors] = useState([]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await doctorsAPI.getAll({ limit: 3 });
        setFeaturedDoctors(res.data.data);
      } catch (error) {
        console.error("Error fetching featured doctors:", error);
      }
    };
    fetchDoctors();
  }, []);

  const stats = [
    { label: 'Expert Doctors', value: '500+', icon: Users, color: 'cyan' },
    { label: 'Happy Patients', value: '10K+', icon: Heart, color: 'blue' },
    { label: 'Years Experience', value: '15+', icon: Award, color: 'green' },
    { label: 'Success Rate', value: '98%', icon: Star, color: 'cyan' },
  ];

  const features = [
    {
      icon: Calendar,
      title: 'Easy Appointments',
      description: 'Book appointments with top doctors in just a few clicks',
      color: 'cyan',
    },
    {
      icon: FileText,
      title: 'Digital Health Records',
      description: 'Access your health records anytime, anywhere securely',
      color: 'blue',
    },
    {
      icon: Shield,
      title: '24/7 Support',
      description: 'Round-the-clock medical assistance and emergency care',
      color: 'green',
    },
    {
      icon: Stethoscope,
      title: 'Expert Doctors',
      description: 'Consult with verified and experienced healthcare professionals',
      color: 'cyan',
    },
  ];

  const testimonials = [
    {
      name: 'Rajesh Kumar',
      role: 'Patient',
      rating: 5,
      text: 'Excellent platform! Found a great cardiologist and booking was super easy. Highly recommended!',
      avatar: 'https://ui-avatars.com/api/?name=Rajesh+Kumar&background=06b6d4&color=fff',
    },
    {
      name: 'Sneha Patel',
      role: 'Patient',
      rating: 5,
      text: 'The symptom checker helped me understand my condition better. Very professional doctors.',
      avatar: 'https://ui-avatars.com/api/?name=Sneha+Patel&background=3b82f6&color=fff',
    },
    {
      name: 'Amit Singh',
      role: 'Patient',
      rating: 5,
      text: 'Great experience! Digital health records feature is very convenient. Keep up the good work!',
      avatar: 'https://ui-avatars.com/api/?name=Amit+Singh&background=10b981&color=fff',
    },
  ];

  const faqs = [
    {
      question: 'How do I book an appointment?',
      answer: 'Simply browse our doctors, select your preferred specialist, and choose an available time slot. You can book instantly online.',
    },
    {
      question: 'Is my health data secure?',
      answer: 'Yes, we use bank-level encryption to protect your health records and personal information. Your privacy is our top priority.',
    },
    {
      question: 'Can I consult doctors online?',
      answer: 'Yes, we offer both in-person and online video consultations with our network of verified doctors.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit/debit cards, UPI, net banking, and digital wallets. You can also pay at the clinic.',
    },
  ];

  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      <section className="relative pt-32 pb-40 lg:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Old Photo as Background for Mobile */}
        <div 
          className="absolute inset-0 z-0 block lg:hidden"
          style={{
            backgroundImage: `url(${heroCute})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat'
          }}
        />
        {/* Overlay for Mobile Visibility - Reduced blur and adjusted opacity */}
        <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/80 z-0 block lg:hidden" />
        
        <div className="absolute inset-0 opacity-30 dark:opacity-20 bg-gradient-background hidden lg:block" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center lg:items-start text-center lg:text-left"
            >
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[var(--healthcare-cyan)]/10 to-[var(--healthcare-blue)]/10 rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-[var(--healthcare-cyan)]" />
                <span className="text-sm font-medium text-[var(--healthcare-cyan)]">
                  Your Health, Our Priority
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Trusted Healthcare
                <br />
                <span className="bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] bg-clip-text text-transparent">
                  At Your Fingertips
                </span>
              </h1>

              <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-xl">
                Connect with verified doctors, book appointments, manage health records, and get expert medical care—all in one seamless platform.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto">
                <Link
                  to="/doctors"
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 px-10 py-5 rounded-[2rem] bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] text-white font-black uppercase tracking-widest shadow-2xl shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all group"
                >
                  <Stethoscope className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                  <span>Find Doctors</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </Link>

                <Link
                  to="/symptom-checker"
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 px-10 py-5 rounded-[2rem] border-2 border-[var(--healthcare-cyan)]/20 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl text-foreground font-black uppercase tracking-widest hover:border-[var(--healthcare-cyan)] hover:bg-white dark:hover:bg-slate-800 shadow-xl transition-all group"
                >
                  <div className="relative">
                    <Activity className="w-6 h-6 text-[var(--healthcare-cyan)]" />
                    <div className="absolute inset-0 bg-cyan-500 blur-md opacity-0 group-hover:opacity-40 animate-pulse transition-opacity" />
                  </div>
                  <span>Check Symptoms</span>
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 mt-12 pt-8 border-t border-border/50 w-full">
                {[
                  { icon: Shield, text: 'Verified Care', color: 'text-cyan-500' },
                  { icon: Clock, text: '24/7 Priority', color: 'text-blue-500' },
                  { icon: Heart, text: 'Patient First', color: 'text-rose-500' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-2 group cursor-default">
                    <div className={`p-2 rounded-lg bg-muted/50 group-hover:bg-white transition-colors`}>
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">{item.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <div className="hidden lg:block relative">
              <div className="relative rounded-[3rem] overflow-hidden border-8 border-white/50 dark:border-slate-800/50 shadow-2xl">
                <img
                  src={heroCute}
                  alt="Healthcare"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] mb-4">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-2">{stat.value}</h3>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 id="features" className="text-4xl font-bold mb-4">Why Choose NirogyaSathi?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience healthcare like never before with our comprehensive digital platform
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                className="bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:shadow-[var(--healthcare-cyan)]/5 transition-all group"
              >
                <div className="p-3 bg-gradient-to-br from-[var(--healthcare-cyan)]/10 to-[var(--healthcare-blue)]/10 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-8 h-8 text-[var(--healthcare-cyan)]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Featured Doctors</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Consult with our verified and experienced healthcare professionals
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {featuredDoctors.map((doctor) => (
              <DoctorCard key={doctor._id || doctor.id} doctor={doctor} />
            ))}
          </div>

          <div className="text-center">
            <Link
              to="/doctors"
              className="inline-flex items-center space-x-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] text-white font-medium hover:shadow-lg transition-all"
            >
              <span>View All Doctors</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 id="testimonials" className="text-4xl font-bold mb-4">What Our Patients Say</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Read experiences from our satisfied patients
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                className="bg-card border border-border rounded-2xl p-6"
              >
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-500" fill="currentColor" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6">"{testimonial.text}"</p>
                <div className="flex items-center space-x-3">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 id="faqs" className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground">
              Got questions? We've got answers
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
                className="bg-card border border-border rounded-2xl p-6"
              >
                <h3 className="font-semibold mb-3">{faq.question}</h3>
                <p className="text-muted-foreground">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {!isAuthenticated && (
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center bg-gradient-primary rounded-3xl p-12 text-white relative overflow-hidden shadow-premium"
          >
            <div className="absolute inset-0 bg-grid-white/10" />
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-xl mb-8 opacity-90">
                Join thousands of patients who trust NirogyaSathi for their healthcare needs
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  to="/register"
                  className="px-8 py-4 rounded-xl bg-white dark:bg-slate-800 text-[var(--healthcare-cyan)] font-medium hover:shadow-2xl transition-all"
                >
                  Create Account
                </Link>
                <Link
                  to="/doctors"
                  className="px-8 py-4 rounded-xl border-2 border-white text-white font-medium hover:bg-white dark:bg-slate-800/10 transition-all"
                >
                  Browse Doctors
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
      )}
    </div>
  );
}
