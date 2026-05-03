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
    <footer className="bg-muted/30 border-t border-border mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <div className="bg-gradient-to-br from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] p-2 rounded-xl">
                <Heart className="w-6 h-6 text-white" fill="white" />
              </div>

              <span className="text-xl font-semibold bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] bg-clip-text text-transparent">
                NirogyaSathi
              </span>
            </Link>

            <p className="text-muted-foreground mb-6 max-w-sm">
              Your trusted healthcare companion. Connecting you with the best
              doctors, hospitals, and healthcare services across India.
            </p>

            <div className="space-y-2">
              <a href="tel:+9118001234567" className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-[var(--healthcare-cyan)] transition-colors">
                <Phone className="w-4 h-4 text-[var(--healthcare-cyan)]" />
                <span>+91 1800-123-4567</span>
              </a>

              <a href="mailto:support@nirogyasathi.com" className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-[var(--healthcare-cyan)] transition-colors">
                <Mail className="w-4 h-4 text-[var(--healthcare-cyan)]" />
                <span>support@nirogyasathi.com</span>
              </a>

              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-[var(--healthcare-cyan)]" />
                <span>Mumbai, India</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Company</h3>

            <ul className="space-y-2">
              {footerLinks.company.map(function (link) {
                return (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className="text-sm text-muted-foreground hover:text-[var(--healthcare-cyan)] transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Services</h3>

            <ul className="space-y-2">
              {footerLinks.services.map(function (link) {
                return (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className="text-sm text-muted-foreground hover:text-[var(--healthcare-cyan)] transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Support</h3>

            <ul className="space-y-2">
              {footerLinks.support.map(function (link) {
                return (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className="text-sm text-muted-foreground hover:text-[var(--healthcare-cyan)] transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-muted-foreground">
              © {currentYear} NirogyaSathi Healthcare. All rights reserved.
            </p>

            <div className="flex items-center space-x-4">
              {socialLinks.map(function (social) {
                const Icon = social.icon;

                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-accent hover:bg-[var(--healthcare-cyan)]/10 hover:text-[var(--healthcare-cyan)] transition-all"
                    aria-label={social.label}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          <div className="mt-6 p-4 bg-[var(--healthcare-blue-light)] dark:bg-[var(--healthcare-blue-light)] rounded-xl">
            <p className="text-xs text-center text-muted-foreground">
              <strong>Disclaimer:</strong> This platform is for informational
              purposes only and does not constitute medical advice. Always
              consult with a qualified healthcare professional for medical
              concerns.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}