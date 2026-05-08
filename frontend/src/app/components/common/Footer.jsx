import { Link } from "react-router-dom";
import {
  Heart,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { name: "About Us", path: "/#features" },
      { name: "Testimonials", path: "/#testimonials" },
      { name: "FAQs", path: "/#faqs" },
      { name: "Health Tips", path: "/#faqs" },
    ],
    services: [
      { name: "Find Doctors", path: "/doctors" },
      { name: "Medical Vault", path: "/vault" },
      { name: "Hospitals", path: "/hospitals" },
      { name: "Blood Bank", path: "/blood-bank" },
      { name: "Ambulances", path: "/ambulance" },
      { name: "Lab Tests", path: "/lab-tests" },
      { name: "Symptom Checker", path: "/symptom-checker" },
    ],
    support: [
      { name: "Help Center", path: "/#faqs" },
      { name: "Contact Us", path: "mailto:support@nirogyasathi.com" },
      { name: "Privacy Policy", path: "#" },
      { name: "Terms of Service", path: "#" },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
  ];

  return (
    <footer className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-white/5 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">

          {/* Brand Identity */}
          <div className="lg:col-span-4 flex flex-col items-center md:items-start text-center md:text-left">
            <Link to="/" className="flex items-center space-x-3 mb-8 group">
              <div className="bg-[var(--healthcare-cyan)] p-2.5 rounded-2xl shadow-xl shadow-[var(--healthcare-cyan)]/20 group-hover:rotate-12 transition-transform duration-500">
                <Heart className="w-6 h-6 text-white" fill="currentColor" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                NirogyaSathi
              </span>
            </Link>

            <p className="text-slate-500 font-medium leading-relaxed mb-8 max-w-sm">
              Your hyper-local healthcare companion. Revolutionizing emergency response and medical access across <span className="text-[var(--healthcare-cyan)] font-bold">Gwalior</span> and beyond.
            </p>

            <div className="flex items-center space-x-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-[var(--healthcare-cyan)] hover:border-[var(--healthcare-cyan)]/50 hover:shadow-lg transition-all"
                    aria-label={social.label}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links Sections */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6">Discovery</h3>
              <ul className="space-y-4">
                {footerLinks.services.slice(0, 4).map((link) => (
                  <li key={link.name}>
                    <Link to={link.path} className="text-sm font-bold text-slate-500 hover:text-[var(--healthcare-cyan)] transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6">Operations</h3>
              <ul className="space-y-4">
                {footerLinks.services.slice(4).map((link) => (
                  <li key={link.name}>
                    <Link to={link.path} className="text-sm font-bold text-slate-500 hover:text-[var(--healthcare-cyan)] transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col items-center sm:items-start text-center sm:text-left col-span-2 sm:col-span-1 mt-8 sm:mt-0">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6">Emergency Contact</h3>
              <div className="space-y-4">
                <a href="tel:+9118001234567" className="flex items-center space-x-3 text-sm font-bold text-red-600 group">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span>1800-NS-GWA</span>
                </a>
                <div className="flex items-start space-x-3 text-sm font-bold text-slate-500">
                  <MapPin className="w-5 h-5 text-[var(--healthcare-cyan)] mt-0.5" />
                  <span>Operational Center<br />Gwalior, MP, India</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-200 dark:border-white/5 pt-10">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            <p className="text-xs font-bold text-slate-400 order-2 lg:order-1">
              © {currentYear} NirogyaSathi Healthcare. All systems operational.
            </p>

            <div className="flex flex-wrap justify-center gap-6 order-1 lg:order-2">
              {footerLinks.support.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-[var(--healthcare-cyan)] transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-10 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2rem]">
            <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-wider leading-relaxed">
              <span className="text-red-500 mr-2">Disclaimer:</span>
              NirogyaSathi provides emergency discovery services and is not a direct medical provider.
              Always consult with local emergency services or hospitals for critical health decisions.
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
}