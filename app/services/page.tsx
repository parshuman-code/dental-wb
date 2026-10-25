import Link from 'next/link';
import { ShieldCheck, Heart, Sparkles, HelpCircle, Phone, Clock, ArrowRight } from 'lucide-react';
import dynamic from 'next/dynamic';
import ScrollReveal from '@/components/ScrollReveal';
import BookAppointmentCTA from '@/components/BookAppointmentCTA';

const OurServices = dynamic(() => import('@/components/OurServices'), {
  loading: () => (
    <div className="py-24 text-center">
      <div className="w-10 h-10 border-3 border-[#2F3E3C] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p className="text-sm font-semibold text-[#2F3E3C]/70">Loading dental services...</p>
    </div>
  ),
});

export const metadata = {
  title: 'Our Dental Services | Dental Clinic',
  description: 'Explore our complete, patient-friendly list of modern dental treatments. Certified MDS specialists, painless procedures, and transparent care.',
};

export default function ServicesPage() {
  return (
    <div className="flex flex-col w-full min-h-screen bg-gradient-to-b from-[#FBF9F1] via-white to-[#E8F0F1]/40 overflow-hidden">
      
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-r from-[#2F3E3C] via-[#354845] to-[#2F3E3C] py-20 sm:py-28 px-4 sm:px-6 lg:px-8 text-center shadow-lg overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#BDDBD1_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <ScrollReveal direction="up">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-[#BDDBD1] border border-white/20 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-6">
              <Sparkles className="w-4 h-4 text-[#BDDBD1]" />
              Gentle & Transparent Dentistry
            </span>
            <h1 className="text-4xl sm:text-6xl font-extrabold text-white mb-6 tracking-tight">
              Comprehensive Dental Care, <br />
              <span className="text-[#BDDBD1]">Tailored to Your Smile</span>
            </h1>
            <p className="text-lg sm:text-xl text-[#E7E9E3] max-w-2xl mx-auto leading-relaxed">
              Explore our full range of advanced treatments designed for comfort, precision, and lasting oral health with certified MDS specialists.
            </p>
          </ScrollReveal>

          {/* Quick Pillars */}
          <ScrollReveal direction="up" delay={150}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 max-w-3xl mx-auto">
              {[
                { title: 'Pain-Free Anesthesia', subtitle: 'Gentle touch techniques' },
                { title: 'Certified MDS Doctors', subtitle: 'Specialized experts' },
                { title: 'Low-Dose Digital X-Rays', subtitle: 'Instant 3D clarity' },
                { title: 'No Hidden Costs', subtitle: 'Transparent pricing' }
              ].map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
                  <div className="text-sm font-bold text-white mb-0.5">{item.title}</div>
                  <div className="text-xs text-[#BDDBD1]">{item.subtitle}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Main Services Component with Grid, Doctor Badges & Interactive Booking Modal */}
      <OurServices />

      {/* Patient Frequently Asked Questions (FAQ) */}
      <section id="faq-section" className="py-20 bg-gradient-to-b from-white to-[#FBF9F1] border-t border-[#BDDBD1]/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up">
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F0F1] text-[#2F3E3C] text-xs font-bold uppercase tracking-wider mb-3">
                <HelpCircle className="w-4 h-4 text-[#2F3E3C]" />
                Patient Questions Answered
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2F3E3C]">
                Common Dental Questions
              </h2>
              <p className="text-sm sm:text-base text-[#2F3E3C]/70 mt-2">
                Everything you need to know before stepping into our clinic.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                q: "What does 'MDS Specialist' mean?",
                a: "An MDS (Master of Dental Surgery) is a qualified doctor who completed 3 additional years of intense hospital residency specializing in a specific field—such as Root Canals (Endodontist), Braces (Orthodontist), or Implants (Periodontist/Prosthodontist). You are always in certified expert hands."
              },
              {
                q: "Are root canal treatments painful?",
                a: "No! Thanks to modern computer-controlled local anesthesia and rotary microscopes, a root canal feels virtually identical to getting a simple filling. In fact, the procedure stops the severe pain you were experiencing before!"
              },
              {
                q: "How do I choose between braces and clear aligners?",
                a: "Traditional braces are great for heavy bite misalignment and are fixed in place. Clear aligners are virtually invisible and removable for dining and brushing. During your checkup, our orthodontist will show you digital 3D scans and help you decide."
              },
              {
                q: "How long does a dental implant last?",
                a: "With routine brushing, flossing, and 6-month checkups, dental implants integrate permanently with your jawbone and can easily last a lifetime."
              },
              {
                q: "How often should I get my teeth cleaned?",
                a: "Dental health organizations recommend a professional cleaning and checkup once every 6 months to remove hardened tartar that toothbrushes cannot reach."
              },
              {
                q: "Can I just come for a consultation first?",
                a: "Absolutely! We encourage consultation-first visits where our doctor inspects your teeth, explains all options with zero pressure, and provides a clear written plan before beginning any treatment."
              }
            ].map((faq, idx) => (
              <ScrollReveal key={idx} direction="up" delay={idx * 80}>
                <div className="p-6 rounded-2xl bg-white/95 border border-[#BDDBD1]/40 shadow-xs hover:shadow-md transition-shadow">
                  <h3 className="text-base sm:text-lg font-bold text-[#2F3E3C] mb-2 flex items-start gap-2">
                    <span className="text-[#BDDBD1] font-black text-xl">Q.</span>
                    <span>{faq.q}</span>
                  </h3>
                  <p className="text-sm text-[#2F3E3C]/75 leading-relaxed pl-6">
                    {faq.a}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Reassurance & Direct Call Support CTA */}
      <section className="py-16 bg-gradient-to-r from-[#2F3E3C] via-[#3d524f] to-[#2F3E3C] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold mb-2">Have a question or tooth emergency?</h3>
            <p className="text-[#BDDBD1] text-sm sm:text-base">
              Call our helpline directly or speak with our clinic care coordinator.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 shrink-0">
            <a 
              href="tel:+919876543210"
              className="px-6 py-3.5 rounded-full bg-gradient-to-r from-[#C7E7EC] via-[#BDDBD1] to-[#C7E7EC] text-[#2F3E3C] font-bold text-sm sm:text-base flex items-center gap-2 hover:brightness-105 transition-all shadow-md"
            >
              <Phone className="w-4 h-4" /> Call Clinic Desk
            </a>
            <BookAppointmentCTA 
              className="px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm sm:text-base border border-white/25 flex items-center gap-2 transition-all cursor-pointer"
            >
              Full Booking Form <ArrowRight className="w-4 h-4" />
            </BookAppointmentCTA>
          </div>
        </div>
      </section>

    </div>
  );
}
