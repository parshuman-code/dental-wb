import Link from 'next/link';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import ScrollReveal from '@/components/ScrollReveal';
import BookAppointmentCTA from '@/components/BookAppointmentCTA';
import GlowCard from '@/components/GlowCard';

const featuredServices = [
  {
    title: 'Teeth Cleaning & Polishing',
    desc: 'Gentle removal of plaque, stains, and tartar to keep your gums healthy and your smile bright.',
    img: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=500&q=80'
  },
  {
    title: 'Root Canal Treatment',
    desc: 'Painless cleaning of infected nerves inside the tooth to save it from extraction — done in a single visit.',
    img: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=500&q=80'
  },
  {
    title: 'Braces & Clear Aligners',
    desc: 'Straighten crooked teeth with metal braces or virtually invisible clear aligners — no wires hassle.',
    img: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=500&q=80'
  },
  {
    title: 'Dental Implants',
    desc: 'Permanent, natural-looking artificial roots placed in the jawbone to replace missing teeth for life.',
    img: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=500&q=80'
  }
];

export default function Home() {
  return (
    <div className="flex flex-col w-full bg-gradient-to-b from-[#FBF9F1] via-white to-[#E8F0F1]/40 overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1606811841689-23dfddce3e95?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
            alt="Modern Dental Clinic"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[#2F3E3C]/60 mix-blend-multiply z-1"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal direction="up" delay={100}>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
              Advanced Dental Care <br />
              <span className="text-[#BDDBD1]">
                For Your Perfect{' '}
                <span className="relative inline-block font-extrabold group cursor-default">
                  {/* Smile word positioned behind the smile icon */}
                  <span className="relative z-0 bg-gradient-to-r from-[#A855F7] via-[#C084FC] to-[#F472B6] bg-clip-text text-transparent">Smile</span>
                  {/* Compact smile curve positioned in front across the word */}
                  <svg
                    className="absolute z-10 -bottom-1.5 sm:-bottom-2 md:-bottom-2.5 left-1/2 -translate-x-1/2 w-[85%] sm:w-[90%] max-w-none overflow-visible drop-shadow-[0_2px_8px_rgba(255,255,255,0.7)] transition-transform duration-300 group-hover:scale-105 pointer-events-none"
                    viewBox="0 0 140 60"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id="whiteSmileGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#F8FAFC" stopOpacity="0.8" />
                        <stop offset="25%" stopColor="#FFFFFF" stopOpacity="0.95" />
                        <stop offset="50%" stopColor="#FFFFFF" stopOpacity="1" />
                        <stop offset="75%" stopColor="#FFFFFF" stopOpacity="0.95" />
                        <stop offset="100%" stopColor="#F8FAFC" stopOpacity="0.8" />
                      </linearGradient>
                    </defs>
                    {/* Left dimple arc */}
                    <path d="M 8 24 C 8.5 16.5 14 12.5 20 14.5 C 14.5 15.5 11 19 10.5 24 Z" fill="url(#whiteSmileGrad)" />
                    {/* Main smile crescent curve */}
                    <path d="M 16 22 C 36 39 53 43 70 43 C 87 43 104 39 124 22 C 105 49 85 51 70 51 C 55 51 35 49 16 22 Z" fill="url(#whiteSmileGrad)" />
                    {/* Right dimple arc */}
                    <path d="M 120 14.5 C 126 12.5 131.5 16.5 132 24 C 129 19 125.5 15.5 120 14.5 Z" fill="url(#whiteSmileGrad)" />
                  </svg>
                </span>
              </span>
            </h1>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={250}>
            <p className="text-xl md:text-2xl text-[#E7E9E3] mb-10 max-w-2xl mx-auto">
              Experience world-class dentistry with state-of-the-art technology and compassionate care.
            </p>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={400}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <BookAppointmentCTA />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 bg-gradient-to-b from-[#FBF9F1] via-white to-[#E8F0F1]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <ScrollReveal direction="left" delay={150}>
              <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                  alt="Our Clinic"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right" delay={250}>
              <div>
                <h2 className="text-4xl font-bold text-[#2F3E3C] mb-6">A New Standard in <span className="text-[#2F3E3C]">Dental Excellence</span></h2>
                <p className="text-lg text-[#2F3E3C]/70 mb-8 leading-relaxed">
                  At Dental, we believe that a healthy smile is the foundation of overall wellness. Our clinic combines advanced scientific procedures with a patient-first approach to deliver painless, effective, and lasting results.
                </p>
                <ul className="space-y-4 mb-10">
                  {['State-of-the-art Equipment', 'Experienced Specialists', 'Painless Treatments', 'Comprehensive Care'].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-[#2F3E3C]/80 font-medium">
                      <CheckCircle2 className="text-[#BDDBD1] w-6 h-6" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-[#2F3E3C] to-[#3d524f] hover:from-[#3d524f] hover:to-[#2F3E3C] text-white rounded-full font-semibold transition-all shadow-md hover:shadow-lg hover:scale-105"
                >
                  Know More About Us <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Featured Services Preview — short cards with "View All" CTA */}
      <section className="py-24 bg-gradient-to-b from-[#E8F0F1]/50 via-[#FBF9F1] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl font-bold text-[#2F3E3C] mb-4">Featured Treatments</h2>
              <p className="text-lg text-[#2F3E3C]/70">A quick look at what we offer — explore all 14+ treatments on our Services page.</p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {featuredServices.map((service, idx) => (
              <ScrollReveal key={idx} direction="up" delay={idx * 150} className="h-full">
                <GlowCard
                  glowColor="rgba(45, 212, 191, 0.22)"
                  glowSize={320}
                  className="h-full bg-gradient-to-br from-[#FBF9F1] via-white to-[#E8F0F1]/70 border border-[#BDDBD1]/30 rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] transform hover:-translate-y-2 flex flex-col justify-between group"
                >
                  <div className="flex flex-col justify-between h-full">
                    <div>
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={service.img}
                          alt={service.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-[#2F3E3C] mb-2">{service.title}</h3>
                        <p className="text-[#2F3E3C]/70 text-sm leading-relaxed mb-4">{service.desc}</p>
                        {/* Doctor badge */}
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#2F3E3C]/80 bg-[#E8F0F1]/70 px-3 py-2 rounded-xl border border-[#BDDBD1]/30">
                          <ShieldCheck className="w-4 h-4 text-[#2F3E3C] shrink-0" />
                          <span>By certified MDS specialists</span>
                        </div>
                      </div>
                    </div>
                    <div className="px-6 pb-6 pt-0">
                      <Link href="/services" className="text-[#2F3E3C] font-semibold flex items-center gap-1 hover:gap-2 transition-all text-sm">
                        Learn more <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </GlowCard>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal direction="up" delay={300}>
            <div className="text-center">
              <Link
                href="/services"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#2F3E3C] via-[#3d524f] to-[#2F3E3C] text-white rounded-full font-semibold hover:brightness-110 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                View All Services <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}