import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Stethoscope, Calendar, FileText, Heart, Users, Award,
  Shield, Clock, Star, ArrowRight, Activity, Sparkles
} from 'lucide-react';
import { doctorsAPI } from '../utils/api';
import DoctorCard from '../components/doctors/DoctorCard';

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

  return (
    <div className="min-h-screen">
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--healthcare-cyan-light)] via-[var(--healthcare-blue-light)] to-transparent opacity-30 dark:opacity-20" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
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

              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Connect with verified doctors, book appointments, manage health records, and get expert medical care—all in one seamless platform.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  to="/doctors"
                  className="inline-flex items-center space-x-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] text-white font-medium hover:shadow-2xl hover:shadow-[var(--healthcare-cyan)]/20 transition-all group"
                >
                  <span>Find Doctors</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/symptom-checker"
                  className="inline-flex items-center space-x-2 px-8 py-4 rounded-xl border-2 border-border hover:border-[var(--healthcare-cyan)] hover:bg-accent transition-all font-medium"
                >
                  <Activity className="w-5 h-5" />
                  <span>Check Symptoms</span>
                </Link>
              </div>

              <div className="flex items-center space-x-6 mt-8 pt-8 border-t border-border">
                {[
                  { icon: Shield, text: 'Verified Doctors' },
                  { icon: Clock, text: 'Quick Booking' },
                  { icon: Heart, text: 'Quality Care' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <item.icon className="w-5 h-5 text-[var(--healthcare-cyan)]" />
                    <span className="text-sm text-muted-foreground">{item.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] rounded-3xl blur-3xl opacity-20" />
                <img
                  src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&q=80"
                  alt="Healthcare"
                  className="relative rounded-3xl shadow-2xl w-full"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
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
            <h2 className="text-4xl font-bold mb-4">Why Choose Nirogya Sathi?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience healthcare like never before with our comprehensive digital platform
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card border border-border rounded-2xl p-6 hover:shadow-2xl hover:shadow-[var(--healthcare-cyan)]/10 transition-all group"
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
            <h2 className="text-4xl font-bold mb-4">What Our Patients Say</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Read experiences from our satisfied patients
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card border border-border rounded-2xl p-6"
              >
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-500" fill="currentColor" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 italic">"{testimonial.text}"</p>
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
            <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground">
              Got questions? We've got answers
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card border border-border rounded-2xl p-6"
              >
                <h3 className="font-semibold mb-3">{faq.question}</h3>
                <p className="text-muted-foreground">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center bg-gradient-to-br from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] rounded-3xl p-12 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-grid-white/10" />
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of patients who trust Nirogya Sathi for their healthcare needs
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/register"
                className="px-8 py-4 rounded-xl bg-white text-[var(--healthcare-cyan)] font-medium hover:shadow-2xl transition-all"
              >
                Create Account
              </Link>
              <Link
                to="/doctors"
                className="px-8 py-4 rounded-xl border-2 border-white text-white font-medium hover:bg-white/10 transition-all"
              >
                Browse Doctors
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
