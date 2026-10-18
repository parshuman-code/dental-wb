import Image from 'next/image';
import { Award, BookOpen, Users, Star } from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';

export default function AboutPage() {
  return (
    <div className="flex flex-col w-full min-h-screen bg-gradient-to-b from-[#FBF9F1] via-white to-[#E8F0F1]/40 overflow-hidden">
      {/* Header Banner */}
      <section className="bg-gradient-to-r from-[#2F3E3C] via-[#354845] to-[#2F3E3C] py-24 px-4 sm:px-6 lg:px-8 text-center shadow-md">
        <ScrollReveal direction="up">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">About Dental</h1>
          <p className="text-xl text-[#E7E9E3] max-w-2xl mx-auto">
            Combining advanced medical science with compassionate care to deliver exceptional dental outcomes.
          </p>
        </ScrollReveal>
      </section>

      {/* Procedures & Scientific Process */}
      <section className="py-24 bg-gradient-to-b from-white via-[#FBF9F1] to-[#E8F0F1]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-[#2F3E3C] mb-4">Our Scientific Approach</h2>
              <p className="text-[#2F3E3C]/70 max-w-2xl mx-auto">We follow evidence-based protocols and leverage cutting-edge technology for precise diagnostics and treatment.</p>
            </div>
          </ScrollReveal>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Endodontic Therapy',
                icon: <BookOpen className="w-8 h-8 text-[#2F3E3C]" />,
                desc: 'Advanced root canal treatments utilizing rotary endodontics and 3D imaging for precise nerve removal and sealing.'
              },
              {
                title: 'Implantology',
                icon: <Award className="w-8 h-8 text-[#2F3E3C]" />,
                desc: 'Surgical placement of titanium fixtures using CBCT-guided surgery for optimal osseointegration and restorative success.'
              },
              {
                title: 'Periodontal Care',
                icon: <Star className="w-8 h-8 text-[#2F3E3C]" />,
                desc: 'Comprehensive management of supporting structures, including scaling, root planing, and guided tissue regeneration.'
              }
            ].map((proc, idx) => (
              <ScrollReveal key={idx} direction="up" delay={idx * 150} className="h-full">
                <div className="p-8 rounded-2xl bg-gradient-to-br from-[#FBF9F1] via-white to-[#E8F0F1]/70 hover:from-white hover:to-[#E8F0F1] hover:shadow-xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] border border-[#BDDBD1]/30 shadow-sm h-full flex flex-col">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#C7E7EC] to-[#BDDBD1] rounded-2xl flex items-center justify-center mb-6 shadow-md shadow-[#C7E7EC]/30">
                    {proc.icon}
                  </div>
                  <h3 className="text-xl font-bold text-[#2F3E3C] mb-3">{proc.title}</h3>
                  <p className="text-[#2F3E3C]/70 leading-relaxed">{proc.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-gradient-to-b from-[#E8F0F1]/40 via-[#FBF9F1] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-[#2F3E3C] mb-4">Our Expert Team</h2>
              <p className="text-[#2F3E3C]/70 max-w-2xl mx-auto">Meet our board-certified specialists dedicated to your oral health.</p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {[1, 2, 3].map((i) => (
              <ScrollReveal key={i} direction="up" delay={i * 150}>
                <div className="bg-gradient-to-br from-[#FBF9F1] via-white to-[#E8F0F1]/70 border border-[#BDDBD1]/30 rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group">
                  <div className="h-72 overflow-hidden relative">
                    <Image 
                      src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=500&q=60"
                      alt={"Doctor " + i}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2F3E3C]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] flex items-end p-6 z-1">
                      <p className="text-white text-sm">Board Certified • 10+ Years Experience</p>
                    </div>
                  </div>
                  <div className="p-6 text-center">
                    <h3 className="text-xl font-bold text-[#2F3E3C] mb-1">Dr. Jane Doe</h3>
                    <p className="text-[#2F3E3C] font-medium mb-3">Orthodontist</p>
                    <p className="text-[#2F3E3C]/70 text-sm">Specializing in clear aligner therapy and complex malocclusions.</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Chief Dentist Spotlight */}
          <ScrollReveal direction="up" delay={200}>
            <div className="bg-gradient-to-r from-[#2F3E3C] via-[#354845] to-[#2F3E3C] rounded-3xl overflow-hidden shadow-2xl border border-[#BDDBD1]/20">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="p-12 lg:p-16 flex flex-col justify-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#C7E7EC]/30 to-[#BDDBD1]/30 text-[#BDDBD1] border border-[#BDDBD1]/30 rounded-full text-sm font-semibold mb-6 w-max shadow-sm">
                    <Award className="w-4 h-4" /> Chief Dental Officer
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-4">Dr. Robert Smith, DDS, MS</h2>
                  <p className="text-lg text-[#E7E9E3] mb-6 font-light">"Our mission is to redefine the dental experience through clinical excellence, innovation, and unwavering compassion."</p>
                  <div className="space-y-3 text-[#E7E9E3]">
                    <p>• Fellow of the American College of Dentists</p>
                    <p>• Over 20 years of clinical experience</p>
                    <p>• Pioneer in guided implant surgery</p>
                  </div>
                </div>
                <div className="h-64 lg:h-auto min-h-[300px] relative">
                  <Image 
                    src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=800&q=80"
                    alt="Chief Dentist"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
