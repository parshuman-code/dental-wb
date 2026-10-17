"use client";

import { MapPin, Phone, Mail, Clock, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import ScrollReveal from '@/components/ScrollReveal';

function CurrentYear() {
  const [year, setYear] = useState<number | null>(null);
  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);
  return <span>{year || ""}</span>;
}

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-[#2F3E3C] to-[#253230] text-[#E7E9E3] py-16 mt-auto overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Side: Contact Info */}
          <ScrollReveal direction="left" delay={100} className="lg:col-span-7">
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-3">Contact Us</h3>
                <p className="text-[#E7E9E3]/90 max-w-lg leading-relaxed text-sm">
                  We are dedicated to providing the best dental care in a comfortable and modern environment. Reach out to our front desk for inquiries or instant appointments.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-[#C7E7EC]/20 to-[#BDDBD1]/20 shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 text-[#BDDBD1]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">Clinic Location</h4>
                    <p className="text-[#E7E9E3]/80 text-xs leading-relaxed">
                      Sector 17, Vashi<br />Navi Mumbai, MH 400703
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-[#C7E7EC]/20 to-[#BDDBD1]/20 shrink-0 mt-0.5">
                    <Phone className="w-4 h-4 text-[#BDDBD1]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">Phone</h4>
                    <p className="text-[#E7E9E3]/80 text-xs">+91 (022) 2789-4567<br />+91 98200 12345</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-[#C7E7EC]/20 to-[#BDDBD1]/20 shrink-0 mt-0.5">
                    <Mail className="w-4 h-4 text-[#BDDBD1]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">Email</h4>
                    <p className="text-[#E7E9E3]/80 text-xs">care@auradental.com<br />desk@auradental.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-[#C7E7EC]/20 to-[#BDDBD1]/20 shrink-0 mt-0.5">
                    <Clock className="w-4 h-4 text-[#BDDBD1]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">Clinic Hours</h4>
                    <p className="text-[#E7E9E3]/80 text-xs leading-relaxed">
                      Mon - Sat: 9:00 AM - 9:00 PM<br />Sun: By Appointment
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-[#C7E7EC]/20 via-[#BDDBD1]/15 to-[#C7E7EC]/20 rounded-2xl border border-[#BDDBD1]/30 shadow-sm max-w-md">
                <AlertCircle className="w-5 h-5 text-[#BDDBD1] shrink-0" />
                <div>
                  <h4 className="font-semibold text-[#BDDBD1] text-xs">24/7 Dental Emergency Care</h4>
                  <p className="text-white font-medium text-xs">+91 98200 99999 (Instant On-Call)</p>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Right Side: Small & Compact Location / Map Part */}
          <ScrollReveal direction="right" delay={200} className="lg:col-span-5 w-full">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#BDDBD1] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#BDDBD1]" />
                  Clinic Map & Directions
                </span>
                <a
                  href="https://maps.google.com/?q=Sector+17+Vashi+Navi+Mumbai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-[#BDDBD1] hover:text-white underline transition-colors"
                >
                  Open in Google Maps ↗
                </a>
              </div>

              {/* Compact Small Map View */}
              <div className="h-[210px] sm:h-[230px] w-full rounded-2xl overflow-hidden shadow-lg relative border border-[#BDDBD1]/30 group">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15082.936087596043!2d72.99266155541992!3d19.0754832!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c13634026217%3A0xb35515c1fae8a71!2sSector%2017%2C%20Vashi%2C%20Navi%20Mumbai%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin" 
                  className="absolute inset-0 w-full h-full border-0 transition-opacity duration-300"
                  allowFullScreen={false} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Aura Dental Clinic Location"
                ></iframe>
              </div>
            </div>
          </ScrollReveal>
        </div>

        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#BDDBD1]/30 to-transparent mt-16 mb-8" />

        <div className="text-center text-[#E7E9E3]/70 text-sm">
          <p suppressHydrationWarning>&copy; <CurrentYear /> Dental Clinic. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
