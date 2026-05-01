"use client";

import { motion } from "motion/react";
import {
  MapPin,
  Star,
  Phone,
  Bed,
  AlertCircle,
  Navigation,
  Clock,
} from "lucide-react";
const mockHospitals = [
  {
    id: "1",
    name: "City Medical Center",
    type: "Multi-Specialty",
    address: "123 Healthcare Way, North Side",
    distance: "2.5 km",
    beds: 150,
    rating: 4.8,
    emergency: true,
    image: "https://images.unsplash.com/photo-1587350859728-117622bc937e?w=800&q=80",
  },
  {
    id: "2",
    name: "Green Valley Hospital",
    type: "Super Specialty",
    address: "456 Wellness Blvd, East District",
    distance: "4.2 km",
    beds: 300,
    rating: 4.6,
    emergency: true,
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80",
  },
  {
    id: "3",
    name: "Grace Community Clinic",
    type: "Primary Care",
    address: "789 Care Lane, Central Hub",
    distance: "1.8 km",
    beds: 50,
    rating: 4.5,
    emergency: false,
    image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&q=80",
  }
];

export default function Hospitals() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Find{" "}
            <span className="bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] bg-clip-text text-transparent">
              Hospitals
            </span>{" "}
            Near You
          </h1>
          <p className="text-lg text-muted-foreground">
            Locate the best hospitals and medical facilities in your area
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-[var(--healthcare-cyan)]/5 to-[var(--healthcare-blue)]/5 border border-border rounded-2xl p-8 mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <AlertCircle className="w-6 h-6 text-[var(--healthcare-red)]" />
                <h2 className="text-xl font-bold">Emergency Hotline</h2>
              </div>
              <p className="text-3xl font-bold text-[var(--healthcare-red)] mb-2">
                108
              </p>
              <p className="text-muted-foreground">
                For medical emergencies, call 108 immediately
              </p>
            </div>

            <div className="bg-muted/30 border border-border rounded-2xl p-6 mb-8 aspect-video flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Interactive Map View</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Map integration would go here
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">All Hospitals</h2>
                <span className="text-sm text-muted-foreground">
                  {mockHospitals.length} hospitals found
                </span>
              </div>

              <div className="space-y-4">
                {mockHospitals.map((hospital, index) => (
                  <motion.div
                    key={hospital.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card border border-border rounded-2xl p-6 hover:shadow-2xl hover:shadow-[var(--healthcare-cyan)]/10 transition-all"
                  >
                    <div className="flex flex-col md:flex-row gap-6">
                      <img
                        src={hospital.image}
                        alt={hospital.name}
                        className="w-full md:w-48 h-48 object-cover rounded-xl"
                      />

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-bold mb-2">
                              {hospital.name}
                            </h3>
                            <span className="px-3 py-1 bg-[var(--healthcare-blue)]/10 text-[var(--healthcare-blue)] rounded-full text-sm">
                              {hospital.type}
                            </span>
                          </div>

                          {hospital.emergency && (
                            <span className="px-3 py-1 bg-[var(--healthcare-red)]/10 text-[var(--healthcare-red)] rounded-full text-sm flex items-center space-x-1">
                              <AlertCircle className="w-4 h-4" />
                              <span>24/7 Emergency</span>
                            </span>
                          )}
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 text-[var(--healthcare-cyan)]" />
                            <span>{hospital.address}</span>
                            <span className="px-2 py-0.5 bg-muted rounded-full text-xs">
                              {hospital.distance}
                            </span>
                          </div>

                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center space-x-1">
                              <Bed className="w-4 h-4 text-muted-foreground" />
                              <span>{hospital.beds} beds</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Star
                                className="w-4 h-4 text-yellow-500"
                                fill="currentColor"
                              />
                              <span className="font-medium">
                                {hospital.rating}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <button className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] text-white">
                            <Navigation className="w-4 h-4" />
                            <span>Get Directions</span>
                          </button>

                          <button className="flex items-center space-x-2 px-4 py-2 rounded-xl border border-border">
                            <Phone className="w-4 h-4" />
                            <span>Call Hospital</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Search Filters</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Hospital Type
                  </label>
                  <select className="w-full px-4 py-2.5 bg-input-background border border-border rounded-xl">
                    <option>All Types</option>
                    <option>Multi-Specialty</option>
                    <option>Super Specialty</option>
                    <option>Primary Care</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Distance
                  </label>
                  <select className="w-full px-4 py-2.5 bg-input-background border border-border rounded-xl">
                    <option>Within 5 km</option>
                    <option>Within 10 km</option>
                    <option>Within 20 km</option>
                    <option>Any distance</option>
                  </select>
                </div>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" defaultChecked />
                  <span className="text-sm">24/7 Emergency only</span>
                </label>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] rounded-2xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-3">Need Help?</h3>
              <p className="text-sm opacity-90 mb-4">
                Our team is available 24/7 to help you
              </p>
              <button className="w-full py-3 bg-white text-[var(--healthcare-cyan)] rounded-xl font-medium">
                Contact Support
              </button>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Tips</h3>

              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Clock className="w-5 h-5 mt-0.5 text-[var(--healthcare-cyan)]" />
                  <p className="text-sm text-muted-foreground">
                    Check visiting hours before going
                  </p>
                </div>

                <div className="flex items-start space-x-2">
                  <Phone className="w-5 h-5 mt-0.5 text-[var(--healthcare-cyan)]" />
                  <p className="text-sm text-muted-foreground">
                    Call before visiting
                  </p>
                </div>

                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 mt-0.5 text-[var(--healthcare-cyan)]" />
                  <p className="text-sm text-muted-foreground">
                    In emergency call 108
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}