"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Sparkles, 
  ShieldCheck, 
  Award, 
  Calendar, 
  Clock, 
  X, 
  Phone, 
  User, 
  Check, 
  Heart,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowLeftRight
} from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import GlowButton from '@/components/GlowButton';

export interface DentalService {
  id: string;
  category: 'Preventive Care' | 'Restorative Care' | 'Orthodontics' | 'Replacement & Implants' | 'Surgical & Gum Care' | 'Kids Dental Care';
  categoryLabel: string;
  title: string;
  plainEnglishSummary: string;
  detailedDescription: string;
  keyPerks: string[];
  duration: string;
  comfortLevel: string;
  image: string;
  popular?: boolean;
}

export const DENTAL_SERVICES: DentalService[] = [
  // 1. Preventive Care
  {
    id: 'teeth-cleaning-polishing',
    category: 'Preventive Care',
    categoryLabel: 'Preventive Care (Keeping Teeth Healthy)',
    title: 'Teeth Cleaning & Polishing',
    plainEnglishSummary: 'Removing plaque, stains, and tartar to keep gums healthy.',
    detailedDescription: 'Gentle ultrasonic cleaning washes away stubborn tartar, coffee/tea stains, and bacterial plaque from teeth and beneath gum lines. It leaves your mouth feeling extraordinarily fresh, prevents gum disease, and restores your teeth’s natural shine.',
    keyPerks: ['Eliminates bad breath & tartar', 'Protects against bleeding gums', 'Gently polishes away tea/coffee stains'],
    duration: '30 - 45 mins',
    comfortLevel: 'Completely Gentle & Painless',
    image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80',
    popular: true
  },
  {
    id: 'dental-checkup-xrays',
    category: 'Preventive Care',
    categoryLabel: 'Preventive Care (Keeping Teeth Healthy)',
    title: 'Dental Checkup & X-Rays',
    plainEnglishSummary: 'Regular mouth inspection to catch cavities early.',
    detailedDescription: 'A comprehensive oral health exam paired with high-definition, ultra-low-radiation digital X-rays. We carefully inspect your teeth, gums, and jawbones to catch minor decay, hairline cracks, or hidden infections long before they turn into painful issues.',
    keyPerks: ['Catches cavities early before pain begins', 'Ultra-low radiation digital imaging', 'Personalized oral health roadmap'],
    duration: '20 - 30 mins',
    comfortLevel: 'Quick & Completely Non-Invasive',
    image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'protective-mouthguards',
    category: 'Preventive Care',
    categoryLabel: 'Preventive Care (Keeping Teeth Healthy)',
    title: 'Protective Mouthguards',
    plainEnglishSummary: 'Custom guards for sports and night teeth-grinding.',
    detailedDescription: 'Custom-molded soft dental appliances made to protect your teeth. We craft tailored night guards to prevent tooth wear and jaw soreness from subconscious teeth grinding (bruxism), as well as heavy-duty athletic guards that cushion blows during sports.',
    keyPerks: ['Prevents tooth wear from night grinding', 'Relieves morning jaw & temple stiffness', 'Protects lips and teeth during contact sports'],
    duration: '15 mins scan & fitting',
    comfortLevel: 'Customized Snug Fit',
    image: 'https://images.unsplash.com/photo-1598256989800-fea5ce5146f2?auto=format&fit=crop&w=800&q=80'
  },

  // 2. Restorative Care
  {
    id: 'tooth-fillings',
    category: 'Restorative Care',
    categoryLabel: 'Restorative Care (Fixing Damaged Teeth)',
    title: 'Tooth Fillings',
    plainEnglishSummary: 'Filling cavities with tooth-colored material to stop pain.',
    detailedDescription: 'When cavity decay begins to damage a tooth, we carefully remove the decay and rebuild the space using durable, natural-shade composite resin. Once cured, the filling seamlessly matches your natural tooth color and completely halts pain.',
    keyPerks: ['100% natural tooth-shade match', 'Stops cavity sensitivity immediately', 'Mercury-free biocompatible resin'],
    duration: '30 - 45 mins',
    comfortLevel: 'Mild Numbing / Pain-Free',
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80',
    popular: true
  },
  {
    id: 'root-canal-treatment',
    category: 'Restorative Care',
    categoryLabel: 'Restorative Care (Fixing Damaged Teeth)',
    title: 'Root Canal Treatment (RCT)',
    plainEnglishSummary: 'Cleaning infected nerves inside the tooth to save it from removal.',
    detailedDescription: 'Instead of pulling an infected or deeply aching tooth, a Root Canal cleans out the inflamed nerve tissue from inside the root canals. The tooth is disinfected, sealed, and protected with a crown, relieving severe throbbing pain and preserving your natural smile.',
    keyPerks: ['Saves your real tooth from extraction', 'Provides permanent pain relief', 'Modern single-visit options available'],
    duration: '45 - 60 mins',
    comfortLevel: 'Completely Numbed & Painless',
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
    popular: true
  },
  {
    id: 'dental-crowns-caps',
    category: 'Restorative Care',
    categoryLabel: 'Restorative Care (Fixing Damaged Teeth)',
    title: 'Dental Crowns & Caps',
    plainEnglishSummary: 'Strong protective covers placed over weak or treated teeth.',
    detailedDescription: 'A custom, tooth-shaped protective helmet made from premium ceramic or zirconia. It completely encapsulates broken, severely worn, or root-canal-treated teeth, restoring 100% of your biting power and shielding the tooth from fractures.',
    keyPerks: ['Rock-solid zirconia and ceramic strength', 'Prevents treated teeth from cracking', 'Custom-shaded to blend with neighboring teeth'],
    duration: '2 brief visits',
    comfortLevel: 'Gentle & Relaxed Procedure',
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'dental-bridges',
    category: 'Restorative Care',
    categoryLabel: 'Restorative Care (Fixing Damaged Teeth)',
    title: 'Dental Bridges',
    plainEnglishSummary: 'Filling gaps created by one or two missing teeth.',
    detailedDescription: 'A fixed, non-removable dental replacement that literally bridges the gap created by one or two missing teeth. Anchored firmly onto neighboring teeth, it stops other teeth from shifting out of place and lets you chew and smile with total confidence.',
    keyPerks: ['Fills empty tooth gaps permanently', 'Restores natural chewing and clear speech', 'Prevents facial sagging and teeth shifting'],
    duration: '2 visits',
    comfortLevel: 'Gentle Placement',
    image: 'https://images.unsplash.com/photo-1588776814546-daab30f310ce?auto=format&fit=crop&w=800&q=80'
  },

  // 3. Orthodontics
  {
    id: 'metal-ceramic-braces',
    category: 'Orthodontics',
    categoryLabel: 'Orthodontics (Teeth Alignment & Braces)',
    title: 'Metal & Ceramic Braces',
    plainEnglishSummary: 'Fixing crooked or misaligned teeth.',
    detailedDescription: 'Time-tested orthodontic brackets that steadily guide crooked, overlapping, or spaced teeth into healthy alignment. Choose between classic durable medical steel or discreet tooth-colored ceramic brackets that blend right in with your teeth.',
    keyPerks: ['Fixes complex bite and crooked teeth', 'Discreet ceramic tooth-colored option', 'Long-lasting structural smile stability'],
    duration: 'Monthly adjustments',
    comfortLevel: 'Mild Pressure During Alignment',
    image: 'https://images.unsplash.com/photo-1592652417729-1a73b222956f?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'clear-aligners-invisible-braces',
    category: 'Orthodontics',
    categoryLabel: 'Orthodontics (Teeth Alignment & Braces)',
    title: 'Clear Aligners / Invisible Braces',
    plainEnglishSummary: 'Transparent removable trays to straighten teeth without wires.',
    detailedDescription: 'A series of custom 3D-crafted transparent plastic aligners that gently nudge your teeth into perfect alignment. Because they are practically invisible and completely removable, you can take them out to eat whatever you want and brush with zero hassles.',
    keyPerks: ['Virtually invisible on your smile', 'Removable for eating and brushing', 'No painful metal wires or food restrictions'],
    duration: '6 - 12 months average',
    comfortLevel: 'Smooth, Wire-Free Comfort',
    image: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=800&q=80',
    popular: true
  },

  // 4. Replacement & Implants
  {
    id: 'dental-implants',
    category: 'Replacement & Implants',
    categoryLabel: 'Replacement & Implants (Replacing Missing Teeth)',
    title: 'Dental Implants',
    plainEnglishSummary: 'Long-lasting artificial roots fixed directly into the jawbone.',
    detailedDescription: 'The gold standard for replacing missing teeth. A biocompatible medical titanium post is gently anchored into your jawbone, acting as a permanent artificial root. Topped with a handcrafted porcelain crown, it looks, feels, and bites just like a natural tooth.',
    keyPerks: ['Permanent lifelong tooth replacement', 'Protects and preserves jawbone strength', 'Does not harm or grind adjacent teeth'],
    duration: 'Step-by-step with guided healing',
    comfortLevel: 'Comfortable Local Anesthesia',
    image: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=800&q=80',
    popular: true
  },
  {
    id: 'full-partial-dentures',
    category: 'Replacement & Implants',
    categoryLabel: 'Replacement & Implants (Replacing Missing Teeth)',
    title: 'Full & Partial Dentures',
    plainEnglishSummary: 'Comfortable removable tooth sets for missing teeth.',
    detailedDescription: 'Lightweight, modern prosthetic sets designed to replace multiple missing teeth or full dental arches. Fabricated with natural gum tinting and lifelike teeth for a secure, comfortable fit that supports facial muscles and restores enjoyable eating.',
    keyPerks: ['Economical full smile replacement', 'Custom-molded for comfortable suction', 'Natural gum-shade contouring'],
    duration: '3 - 4 custom fitting visits',
    comfortLevel: 'Completely Non-Invasive',
    image: 'https://images.unsplash.com/photo-1571772996211-2f02c9727629?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'veneers-smile-makeover',
    category: 'Replacement & Implants',
    categoryLabel: 'Replacement & Implants (Replacing Missing Teeth)',
    title: 'Veneers & Smile Makeover',
    plainEnglishSummary: 'Thin porcelain shells to fix chipped, discolored, or gapped front teeth.',
    detailedDescription: 'Ultra-thin, custom-crafted ceramic or composite shells bonded over the front face of your teeth. They instantly correct deep stains, gaps between teeth, uneven lengths, and chips, creating a radiant, symmetrical, movie-star smile.',
    keyPerks: ['Transforms chipped and discolored teeth', 'Stain-resistant high-luster porcelain', 'Custom-shaped to match facial harmony'],
    duration: '2 custom appointments',
    comfortLevel: 'Minimal Prep / Very Comfortable',
    image: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?auto=format&fit=crop&w=800&q=80',
    popular: true
  },

  // 5. Surgical & Gum Care
  {
    id: 'painless-tooth-extraction',
    category: 'Surgical & Gum Care',
    categoryLabel: 'Surgical & Gum Care (Minor Surgeries & Gum Health)',
    title: 'Painless Tooth Extraction',
    plainEnglishSummary: 'Safe removal of severely damaged or wisdom teeth.',
    detailedDescription: 'When a tooth is broken beyond repair or an impacted wisdom tooth causes repeated swelling, our oral surgeons remove it smoothly. With advanced local anesthesia and gentle techniques, the procedure is completely painless and ensures rapid healing.',
    keyPerks: ['Advanced numbing ensures zero pain', 'Safe removal of impacted wisdom teeth', 'Clear aftercare instructions for speedy healing'],
    duration: '30 - 45 mins',
    comfortLevel: 'Completely Numbed & Gentle',
    image: 'https://images.unsplash.com/photo-1629909615184-74f495363b67?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'gum-disease-treatment',
    category: 'Surgical & Gum Care',
    categoryLabel: 'Surgical & Gum Care (Minor Surgeries & Gum Health)',
    title: 'Gum Disease Treatment',
    plainEnglishSummary: 'Cleaning deep under the gums to treat bleeding and swelling.',
    detailedDescription: 'A focused deep-cleaning therapy (periodontal scaling & root planing) beneath the gum pocket to remove toxic bacterial colonies. It stops chronic gum bleeding, resolves bad breath, tightens swollen gums, and secures teeth from loosening.',
    keyPerks: ['Stops bleeding & tender swollen gums', 'Halts progression of periodontal bone loss', 'Eliminates deep bacterial pockets'],
    duration: '40 - 50 mins per zone',
    comfortLevel: 'Topical Numbing / Comfortable',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80'
  },

  // 6. Kids Dental Care
  {
    id: 'child-cavity-protection-milk-teeth',
    category: 'Kids Dental Care',
    categoryLabel: 'Kids Dental Care (Pediatric Dentistry)',
    title: 'Child Cavity Protection & Milk Tooth Care',
    plainEnglishSummary: 'Gentle dental care tailored specifically for young children.',
    detailedDescription: 'A playful, anxiety-free dental experience specially crafted for little smiles. We offer protective fluoride varnishes, painless cavity dental sealants that shield chewing grooves, and gentle care that ensures milk teeth stay healthy for incoming adult teeth.',
    keyPerks: ['100% fear-free & friendly pediatric doctors', 'Protective dental sealants for chewing teeth', 'Fluoride varnish strengthens young enamel'],
    duration: '20 - 30 mins',
    comfortLevel: 'Fun, Gentle & Tear-Free',
    image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80',
    popular: true
  }
];

const CATEGORIES = [
  'All',
  'Preventive Care',
  'Restorative Care',
  'Orthodontics',
  'Replacement & Implants',
  'Surgical & Gum Care',
  'Kids Dental Care'
] as const;

export default function OurServices() {
  const { user, signInWithGoogle } = useAuth();
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [windowWidth, setWindowWidth] = useState<number>(1200);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  
  // Touch gesture tracking for mobile swipe
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);
  const touchEndYRef = useRef<number | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedServiceForModal, setSelectedServiceForModal] = useState<DentalService>(DENTAL_SERVICES[0]);
  
  // Modal form fields
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('10:30 AM');
  const [notes, setNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingRef, setBookingRef] = useState('');

  // Prefill patient name when user is logged in
  useEffect(() => {
    if (user && !patientName) {
      setPatientName(user.displayName || '');
    }
  }, [user, patientName]);

  const totalCards = DENTAL_SERVICES.length;

  // Window resize & reduced motion listener
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handleMediaChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleMediaChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);

  // Safe navigation handlers with transition locking (shorter, responsive lock to avoid input lag on phones)
  const handleNext = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setActiveIndex((prev) => (prev + 1) % totalCards);
    setTimeout(() => {
      setIsTransitioning(false);
    }, prefersReducedMotion ? 50 : 380);
  }, [isTransitioning, totalCards, prefersReducedMotion]);

  const handlePrev = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setActiveIndex((prev) => (prev - 1 + totalCards) % totalCards);
    setTimeout(() => {
      setIsTransitioning(false);
    }, prefersReducedMotion ? 50 : 380);
  }, [isTransitioning, totalCards, prefersReducedMotion]);

  const jumpToIndex = useCallback((targetIndex: number) => {
    if (isTransitioning || targetIndex === activeIndex) return;
    setIsTransitioning(true);
    setActiveIndex(targetIndex);
    setTimeout(() => {
      setIsTransitioning(false);
    }, prefersReducedMotion ? 50 : 380);
  }, [isTransitioning, activeIndex, prefersReducedMotion]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isModalOpen) return;
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, isModalOpen]);

  // Touch Swipe Handlers for mobile - responsive with horizontal intent detection
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    touchEndXRef.current = null;
    touchEndYRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.touches[0].clientX;
    touchEndYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (
      touchStartXRef.current !== null && 
      touchEndXRef.current !== null &&
      touchStartYRef.current !== null &&
      touchEndYRef.current !== null
    ) {
      const deltaX = touchEndXRef.current - touchStartXRef.current;
      const deltaY = touchEndYRef.current - touchStartYRef.current;
      
      // Only trigger horizontal card swipe if movement is predominantly horizontal
      // and exceeds a gentle 35px threshold for instant, responsive feel on mobile
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 35) {
        if (deltaX > 0) {
          handlePrev();
        } else {
          handleNext();
        }
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    touchEndXRef.current = null;
    touchEndYRef.current = null;
  };

  // Dedicated Down Arrow: scrolls to the next section (FAQ)
  const handleScrollDown = () => {
    const nextSection = document.getElementById('faq-section');
    if (nextSection) {
      const navOffset = 90; // account for fixed/sticky navbar height
      const targetPos = nextSection.getBoundingClientRect().top + window.pageYOffset - navOffset;
      window.scrollTo({
        top: targetPos,
        behavior: 'smooth'
      });
    }
  };

  // Category jump handler
  const handleCategoryClick = (category: string) => {
    if (category === 'All') {
      jumpToIndex(0);
      return;
    }
    const targetIdx = DENTAL_SERVICES.findIndex(s => s.category === category);
    if (targetIdx !== -1) {
      jumpToIndex(targetIdx);
    }
  };

  const activeService = DENTAL_SERVICES[activeIndex];

  // Helper to compute circular offset for card layering
  const getCircularOffset = (index: number) => {
    let diff = index - activeIndex;
    while (diff > totalCards / 2) diff -= totalCards;
    while (diff < -totalCards / 2) diff += totalCards;
    return diff;
  };

  // Modal actions — require sign-in before booking
  const openBookingModal = async (service: DentalService) => {
    if (!user) {
      const ok = await signInWithGoogle();
      if (!ok) {
        // User closed or refused the sign in popup
        return;
      }
    }

    setSelectedServiceForModal(service);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setAppointmentDate(tomorrow.toISOString().split('T')[0]);
    setBookingSuccess(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setBookingSuccess(false);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const todayStr = new Date().toISOString().split('T')[0];
    if (appointmentDate && appointmentDate < todayStr) {
      alert('Cannot select a past date. Please choose today or a future date for your appointment.');
      return;
    }

    if (!patientName.trim() || !patientPhone.trim() || !appointmentDate) {
      alert('Please fill in your name, contact number, and preferred date.');
      return;
    }

    let currentUser = user;
    if (!currentUser) {
      const ok = await signInWithGoogle();
      if (!ok) {
        return;
      }
      currentUser = (await import('@/lib/firebase')).auth.currentUser;
    }

    const refNumber = 'LD-' + Math.floor(100000 + Math.random() * 900000);
    setBookingRef(refNumber);

    try {
      const appointmentData = {
        referenceCode: refNumber,
        treatment: selectedServiceForModal.title,
        date: appointmentDate,
        time: appointmentTime,
        doctor: 'MDS Specialist (' + selectedServiceForModal.category + ')',
        patientName: patientName,
        patientPhone: patientPhone,
        notes: notes,
        status: 'Pending',
        uid: currentUser ? currentUser.uid : '',
        patientEmail: currentUser?.email || '',
        createdAt: serverTimestamp(),
      };

      // 1. Save directly to Cloud Firestore
      await addDoc(collection(db, 'appointments'), appointmentData);

      // 2. Also keep in local storage for instant offline access
      const existing = localStorage.getItem('luminous_appointments');
      const list = existing ? JSON.parse(existing) : [];
      list.unshift({ id: refNumber, ...appointmentData, createdAt: new Date().toISOString() });
      localStorage.setItem('luminous_appointments', JSON.stringify(list));
    } catch (err) {
      console.error('Error booking treatment:', err);
    }

    setBookingSuccess(true);
  };

  const handleWhatsAppConfirmation = () => {
    const message = `Hello Dental Clinic, I would like to confirm my appointment request.\n\n*Reference:* ${bookingRef}\n*Treatment:* ${selectedServiceForModal.title}\n*Patient Name:* ${patientName}\n*Date:* ${appointmentDate}\n*Time:* ${appointmentTime}\n${notes ? `*Notes:* ${notes}` : ''}`;
    const url = `https://wa.me/919876543210?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Responsive card positioning calculations
  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;
  
  // Card base dimensions (slightly more compact as requested)
  const cardWidth = isMobile ? Math.min(windowWidth * 0.74, 260) : isTablet ? 295 : 345;
  const stepOffset1 = isMobile ? cardWidth * 0.62 : isTablet ? cardWidth * 0.74 : cardWidth * 0.80;
  const stepOffset2 = cardWidth * 1.4;

  return (
    <section 
      id="services-carousel-section"
      className="relative w-full py-16 sm:py-24 bg-gradient-to-b from-[#2F3E3C] via-[#273735] to-[#202E2C] text-white overflow-hidden"
    >
      {/* Background Dot Grid pattern identical to website hero */}
      <div 
        className="absolute inset-0 opacity-12 bg-[radial-gradient(#BDDBD1_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" 
        aria-hidden="true"
      />

      {/* Subtle ambient light orb */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-[#BDDBD1]/10 rounded-full blur-[130px] pointer-events-none" 
        aria-hidden="true" 
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <ScrollReveal direction="up">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-[#BDDBD1] border border-white/20 text-xs sm:text-sm font-bold tracking-wide uppercase mb-4 shadow-sm">
              <Award className="w-4 h-4 text-[#BDDBD1]" />
              Clear & Transparent Dental Care
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              Our Complete Dental Treatments
            </h2>
            <p className="text-base sm:text-lg text-[#E7E9E3]/85 leading-relaxed">
              Explore all {totalCards} treatments in our interactive 3D clinic showcase. Every procedure is performed with gentle care by certified MDS doctors.
            </p>
          </div>
        </ScrollReveal>

        {/* Quality & Doctor Guarantee Ribbon */}
        <ScrollReveal direction="up" delay={80}>
          <div className="mb-10 max-w-5xl mx-auto bg-white/10 backdrop-blur-md rounded-2xl p-5 sm:p-7 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-white/15">
            <div className="flex items-start sm:items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-[#BDDBD1] to-[#C7E7EC] rounded-2xl text-[#2F3E3C] shadow-md shrink-0">
                <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  100% Certified MDS Specialists Guarantee
                </h3>
                <p className="text-xs sm:text-sm text-[#BDDBD1] mt-0.5 max-w-2xl">
                  Every treatment in our clinic is performed safely by qualified dental doctors and post-graduate MDS specialists using sterilized, international-grade equipment.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end">
              <div className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-center flex-1 md:flex-initial">
                <span className="block text-xl font-black text-[#C7E7EC]">15,000+</span>
                <span className="text-[11px] text-white/80">Smiles Restored</span>
              </div>
              <div className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-center flex-1 md:flex-initial">
                <span className="block text-xl font-black text-[#C7E7EC]">100%</span>
                <span className="text-[11px] text-white/80">Sterilized Safety</span>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Category Navigation Bar - Horizontal Scrolling on Mobile/Phone */}
        <div className="mb-8 w-full">
          <div 
            className="flex items-center sm:justify-center gap-2 overflow-x-auto no-scrollbar scroll-smooth flex-nowrap pb-3 pt-1 px-4 sm:px-2 -mx-4 sm:mx-0 w-auto overscroll-x-contain touch-pan-x"
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: 'x proximity',
            }}
          >
            {CATEGORIES.map((cat) => {
              const isSelected = cat === 'All' 
                ? activeIndex === 0 
                : activeService.category === cat;
              const count = cat === 'All'
                ? totalCards
                : DENTAL_SERVICES.filter(s => s.category === cat).length;

              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  style={{ scrollSnapAlign: 'start' }}
                  className={`shrink-0 px-3.5 sm:px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors duration-200 flex items-center gap-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#BDDBD1]/50 ${
                    isSelected
                      ? 'bg-[#BDDBD1] text-[#2F3E3C] shadow-md shadow-[#BDDBD1]/25 font-bold'
                      : 'bg-white/10 text-white/85 hover:text-white hover:bg-white/20 border border-white/15'
                  }`}
                  aria-label={`Jump to ${cat} treatments`}
                >
                  <span>{cat}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isSelected ? 'bg-[#2F3E3C] text-[#BDDBD1]' : 'bg-black/30 text-white/85'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3D LAYERED SERVICE CARDS CAROUSEL */}
        {/* ========================================================================= */}
        <div 
          className="relative w-full h-[540px] sm:h-[580px] md:h-[610px] flex items-center justify-center select-none overflow-hidden -mt-10 touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          role="region"
          aria-label="3D Dental Services Carousel"
        >
          {/* Circular Left Arrow Button */}
          <button
            onClick={handlePrev}
            disabled={isTransitioning}
            className="absolute left-2 sm:left-4 md:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-40 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#243331]/85 hover:bg-[#2F3E3C] text-[#BDDBD1] hover:text-white border-2 border-[#BDDBD1]/50 hover:border-[#BDDBD1] shadow-2xl backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#BDDBD1]/40 disabled:opacity-50"
            aria-label="Previous dental treatment card"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
          </button>

          {/* Circular Right Arrow Button */}
          <button
            onClick={handleNext}
            disabled={isTransitioning}
            className="absolute right-2 sm:right-4 md:right-6 lg:right-8 top-1/2 -translate-y-1/2 z-40 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#243331]/85 hover:bg-[#2F3E3C] text-[#BDDBD1] hover:text-white border-2 border-[#BDDBD1]/50 hover:border-[#BDDBD1] shadow-2xl backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#BDDBD1]/40 disabled:opacity-50"
            aria-label="Next dental treatment card"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
          </button>

          {/* Cards Track Container */}
          <div className="relative w-full h-full flex items-center justify-center">
            {DENTAL_SERVICES.map((service, index) => {
              const diff = getCircularOffset(index);
              const isActive = diff === 0;
              const isVisible = Math.abs(diff) <= 1;

              // Style mappings based on circular offset distance
              let translateX = 0;
              let scale = 1;
              let zIndex = 30;
              let opacity = 1;
              let blurPx = 0;
              let boxShadow = isMobile 
                ? '0 10px 25px -5px rgba(0, 0, 0, 0.35)' 
                : '0 25px 60px -15px rgba(0, 0, 0, 0.55), 0 0 35px -5px rgba(189, 219, 209, 0.35)';

              if (diff === 0) {
                translateX = 0;
                scale = 1;
                zIndex = 30;
                opacity = 1;
                blurPx = 0;
              } else if (diff === -1) {
                translateX = -stepOffset1;
                scale = 0.88;
                zIndex = 20;
                opacity = 0.75;
                blurPx = isMobile ? 0 : 2; // avoid heavy GPU blur filter on phone
                boxShadow = isMobile 
                  ? '0 6px 15px -4px rgba(0, 0, 0, 0.25)' 
                  : '0 15px 35px -10px rgba(0, 0, 0, 0.45), 0 0 20px -5px rgba(189, 219, 209, 0.2)';
              } else if (diff === 1) {
                translateX = stepOffset1;
                scale = 0.88;
                zIndex = 20;
                opacity = 0.75;
                blurPx = isMobile ? 0 : 2; // avoid heavy GPU blur filter on phone
                boxShadow = isMobile 
                  ? '0 6px 15px -4px rgba(0, 0, 0, 0.25)' 
                  : '0 15px 35px -10px rgba(0, 0, 0, 0.45), 0 0 20px -5px rgba(189, 219, 209, 0.2)';
              } else {
                const dir = diff > 0 ? 1 : -1;
                translateX = dir * (stepOffset1 + cardWidth);
                scale = 0.7;
                zIndex = 0;
                opacity = 0;
                blurPx = isMobile ? 0 : 4;
                boxShadow = 'none';
              }

              // Card click: clicking side cards brings them to center smoothly
              const handleCardClick = () => {
                if (diff === -1) handlePrev();
                else if (diff === 1) handleNext();
              };

              const transitionDuration = isMobile ? '380ms' : '500ms';

              return (
                <div
                  key={service.id}
                  onClick={!isActive ? handleCardClick : undefined}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: `${cardWidth}px`,
                    transform: `translate3d(calc(-50% + ${translateX}px), -50%, 0) scale(${scale})`,
                    zIndex,
                    opacity,
                    filter: blurPx > 0 ? `blur(${blurPx}px)` : undefined,
                    boxShadow,
                    transition: prefersReducedMotion
                      ? 'none'
                      : `transform ${transitionDuration} cubic-bezier(0.16, 1, 0.3, 1), opacity ${transitionDuration} cubic-bezier(0.16, 1, 0.3, 1)`,
                    pointerEvents: isVisible ? 'auto' : 'none',
                    cursor: !isActive && isVisible ? 'pointer' : 'default',
                    willChange: 'transform, opacity',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                  }}
                  className="rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-[#FBF9F1] via-white to-[#E8F0F1] border border-[#BDDBD1]/60 flex flex-col justify-between"
                  aria-hidden={!isActive}
                >
                  {/* Top Image Section */}
                  <div className="relative h-36 sm:h-44 w-full overflow-hidden bg-slate-900 shrink-0">
                    <Image
                      src={service.image}
                      alt={service.title}
                      fill
                      sizes="(max-width: 640px) 90vw, (max-width: 1024px) 500px, 580px"
                      className="object-cover transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent pointer-events-none z-1" />

                    {/* Category pill on image */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-white/95 text-[#2F3E3C] shadow-md border border-white/50">
                        {service.category}
                      </span>
                    </div>

                    {/* Popular badge */}
                    {service.popular && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-[#2F3E3C] shadow-md">
                          <Sparkles className="w-3 h-3 text-[#2F3E3C]" /> Popular
                        </span>
                      </div>
                    )}

                    {/* Duration chip on image */}
                    <div className="absolute bottom-2 left-3 flex items-center gap-1 text-white/95 text-[10px] sm:text-[11px] font-medium bg-black/55 backdrop-blur-md px-2 py-0.5 rounded-md">
                      <Clock className="w-3 h-3 text-[#BDDBD1]" />
                      <span>{service.duration}</span>
                    </div>

                    {/* Comfort Level chip on image */}
                    <div className="absolute bottom-2 right-3 flex items-center gap-1 text-white/95 text-[10px] sm:text-[11px] font-medium bg-black/55 backdrop-blur-md px-2 py-0.5 rounded-md">
                      <Heart className="w-3 h-3 text-pink-300 fill-pink-300" />
                      <span>{service.comfortLevel}</span>
                    </div>
                  </div>

                  {/* Card Content Section */}
                  <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 text-left">
                    <div>
                      {/* Treatment Title */}
                      <h3 className="text-base sm:text-lg font-bold text-[#2F3E3C] mb-1.5 leading-snug">
                        {service.title}
                      </h3>

                      {/* Plain English Summary Pill */}
                      <div className="text-[11px] sm:text-xs font-semibold text-[#2F3E3C]/90 bg-[#E8F0F1]/90 px-2.5 py-1.5 rounded-xl border border-[#BDDBD1]/40 mb-2 leading-snug">
                        💡 {service.plainEnglishSummary}
                      </div>

                      {/* Detailed Description */}
                      <p className="text-xs sm:text-[13px] text-[#2F3E3C]/75 mb-2 leading-relaxed line-clamp-2">
                        {service.detailedDescription}
                      </p>

                      {/* Key Perks List */}
                      <div className="space-y-1 mb-2.5">
                        {service.keyPerks.slice(0, 3).map((perk, pIdx) => (
                          <div key={pIdx} className="flex items-start gap-1.5 text-xs sm:text-[12px] text-[#2F3E3C]/80 font-medium">
                            <Check className="w-3.5 h-3.5 text-[#2F3E3C] shrink-0 mt-0.5 bg-[#BDDBD1]/70 rounded-full p-0.5" />
                            <span className="line-clamp-1">{perk}</span>
                          </div>
                        ))}
                      </div>

                      {/* Doctor Delivery Note Badge */}
                      <div className="p-2 rounded-xl bg-gradient-to-r from-[#E8F0F1]/95 via-[#C7E7EC]/40 to-[#E8F0F1]/95 border border-[#BDDBD1]/40 flex items-center gap-2 mb-3 shadow-2xs">
                        <div className="p-1 rounded-md bg-gradient-to-br from-[#BDDBD1] to-[#C7E7EC] text-[#2F3E3C] shrink-0">
                          <Award className="w-3 h-3" />
                        </div>
                        <p className="text-[10px] sm:text-[10.5px] font-bold text-[#2F3E3C] leading-snug">
                          Carried out safely by certified dental doctors / MDS specialists.
                        </p>
                      </div>
                    </div>

                    {/* Book Appointment CTA */}
                    <div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isActive) openBookingModal(service);
                          else handleCardClick();
                        }}
                        disabled={!isActive}
                        className={`w-full py-2.5 sm:py-3 px-3 rounded-xl font-bold text-xs sm:text-[13px] transition-all duration-300 flex items-center justify-center gap-2 ${
                          isActive
                            ? 'cursor-pointer bg-gradient-to-r from-[#2F3E3C] via-[#3d524f] to-[#2F3E3C] hover:brightness-110 text-white shadow-md hover:shadow-lg hover:scale-[1.02]'
                            : 'bg-[#2F3E3C]/40 text-white/70 cursor-pointer pointer-events-none'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5 text-[#BDDBD1]" />
                        <span>Book Appointment for this Treatment</span>
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PAGINATION DOTS (SYNCHRONIZED WITH ACTIVE CARD) */}
        {/* ========================================================================= */}
        <div 
          className="flex items-center justify-center gap-2 mt-6 mb-4 flex-wrap max-w-lg mx-auto"
          role="tablist"
          aria-label="Carousel pagination"
        >
          {DENTAL_SERVICES.map((service, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={service.id}
                onClick={() => jumpToIndex(idx)}
                className={`transition-all duration-300 rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#BDDBD1] ${
                  isActive
                    ? 'w-7 sm:w-8 h-2.5 sm:h-3 bg-[#BDDBD1] shadow-[0_0_12px_rgba(189,219,209,0.85)]'
                    : 'w-2.5 sm:w-3 h-2.5 sm:h-3 bg-white/25 hover:bg-white/50'
                }`}
                aria-label={`Jump to treatment ${idx + 1}: ${service.title}`}
                aria-selected={isActive}
                role="tab"
              />
            );
          })}
        </div>

        {/* Active Treatment Counter Indicator */}
        <div className="text-center text-xs font-semibold text-[#BDDBD1]/80 mb-6">
          <span>Treatment {activeIndex + 1} of {totalCards}: </span>
          <span className="text-white font-bold">{activeService.title}</span>
        </div>

        {/* ========================================================================= */}
        {/* SEPARATE DOWN ARROW: SCROLLS PAGE TO NEXT SECTION (FAQ) */}
        {/* ========================================================================= */}
        <div className="text-center pt-2 pb-2">
          <button
            onClick={handleScrollDown}
            className="group inline-flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer"
            aria-label="Scroll down to FAQs and more clinic details"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-[#BDDBD1]/50 group-hover:border-[#BDDBD1] bg-white/10 group-hover:bg-white/20 text-[#BDDBD1] group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-md group-hover:shadow-lg group-hover:scale-110 active:scale-95">
              <ChevronDown className="w-6 h-6 stroke-[2.5] animate-bounce" />
            </div>
            <span className="text-xs font-semibold text-[#BDDBD1]/75 group-hover:text-white transition-colors uppercase tracking-wider">
              More Details Below (FAQ)
            </span>
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE BOOKING MODAL */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-lg bg-gradient-to-br from-[#FBF9F1] via-white to-[#E8F0F1] rounded-3xl shadow-2xl border border-[#BDDBD1]/50 overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200 text-[#2F3E3C]">
            
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-[#2F3E3C] via-[#354845] to-[#2F3E3C] text-white flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider text-[#BDDBD1] font-semibold">
                  Fast Patient Booking
                </span>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#BDDBD1]" />
                  Schedule Treatment
                </h3>
              </div>
              <button 
                onClick={closeModal}
                className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto">
              {!bookingSuccess ? (
                <form onSubmit={handleModalSubmit} className="space-y-5">
                  
                  {/* Selected Treatment Preview Box */}
                  <div className="p-4 rounded-2xl bg-white/90 border border-[#BDDBD1]/40 shadow-xs">
                    <label className="block text-xs font-bold text-[#2F3E3C]/60 uppercase tracking-wider mb-1">
                      Selected Treatment
                    </label>
                    <select
                      value={selectedServiceForModal.id}
                      onChange={(e) => {
                        const found = DENTAL_SERVICES.find(s => s.id === e.target.value);
                        if (found) setSelectedServiceForModal(found);
                      }}
                      className="w-full text-base font-bold text-[#2F3E3C] bg-transparent outline-none cursor-pointer border-b border-[#BDDBD1]/40 pb-1 focus:border-[#2F3E3C]"
                    >
                      {DENTAL_SERVICES.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.title} ({s.category})
                        </option>
                      ))}
                    </select>

                    <p className="text-xs text-[#2F3E3C]/70 mt-2 font-medium">
                      💡 {selectedServiceForModal.plainEnglishSummary}
                    </p>

                    {/* Specialist Doctor Badge inside Modal */}
                    <div className="mt-3 pt-3 border-t border-[#BDDBD1]/20 flex items-center gap-2 text-xs font-semibold text-[#2F3E3C]">
                      <ShieldCheck className="w-4 h-4 text-[#2F3E3C] shrink-0" />
                      <span>Carried out safely by certified dental doctors / MDS specialists.</span>
                    </div>
                  </div>

                  {/* Patient Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-900" /> Patient Full Name *
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full px-4 py-3 bg-white rounded-xl border-2 border-slate-300 text-slate-950 font-semibold placeholder:text-slate-400 focus:outline-none focus:border-[#2F3E3C] focus:ring-2 focus:ring-[#BDDBD1]/50 text-sm transition-all shadow-xs"
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-900" /> Contact Phone / WhatsApp *
                    </label>
                    <input 
                      type="tel"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-white rounded-xl border-2 border-slate-300 text-slate-950 font-semibold placeholder:text-slate-400 focus:outline-none focus:border-[#2F3E3C] focus:ring-2 focus:ring-[#BDDBD1]/50 text-sm transition-all shadow-xs"
                    />
                  </div>

                  {/* Date & Time Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-900" /> Preferred Date *
                      </label>
                      <input 
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        className={`w-full px-3.5 py-3 bg-white rounded-xl border-2 ${
                          appointmentDate && appointmentDate < new Date().toISOString().split('T')[0] 
                            ? 'border-red-400 bg-red-50/40' 
                            : 'border-slate-300'
                        } text-slate-950 font-semibold focus:outline-none focus:border-[#2F3E3C] focus:ring-2 focus:ring-[#BDDBD1]/50 text-sm transition-all shadow-xs`}
                      />
                      {appointmentDate && appointmentDate < new Date().toISOString().split('T')[0] && (
                        <p className="text-[11px] font-bold text-red-600 mt-1">
                          ⚠️ Past dates cannot be selected.
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-900" /> Time Slot
                      </label>
                      <select
                        value={appointmentTime}
                        onChange={(e) => setAppointmentTime(e.target.value)}
                        className="w-full px-3.5 py-3 bg-white rounded-xl border-2 border-slate-300 text-slate-950 font-semibold focus:outline-none focus:border-[#2F3E3C] focus:ring-2 focus:ring-[#BDDBD1]/50 text-sm transition-all cursor-pointer shadow-xs"
                      >
                        <option value="09:30 AM">09:30 AM (Morning)</option>
                        <option value="10:30 AM">10:30 AM (Morning)</option>
                        <option value="12:00 PM">12:00 PM (Noon)</option>
                        <option value="04:30 PM">04:30 PM (Evening)</option>
                        <option value="06:30 PM">06:30 PM (Evening)</option>
                      </select>
                    </div>
                  </div>

                  {/* Notes / Special Requests */}
                  <div>
                    <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                      Notes / Any Pain or Sensitivity? (Optional)
                    </label>
                    <textarea 
                      rows={2}
                      placeholder="e.g. Mild sensitivity to cold water on upper right tooth..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white rounded-xl border-2 border-slate-300 text-slate-950 font-semibold placeholder:text-slate-400 focus:outline-none focus:border-[#2F3E3C] focus:ring-2 focus:ring-[#BDDBD1]/50 text-sm transition-all resize-none shadow-xs"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 py-3 px-4 rounded-xl border border-[#BDDBD1]/50 font-semibold text-sm text-[#2F3E3C]/80 hover:bg-[#E8F0F1] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <GlowButton
                      type="submit"
                      glowColor="rgba(45, 212, 191, 0.4)"
                      glowSize={160}
                      className="flex-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#2F3E3C] via-[#3d524f] to-[#2F3E3C] text-white font-semibold text-sm hover:brightness-110 shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4 text-[#BDDBD1]" />
                      Confirm Booking Request
                    </GlowButton>
                  </div>
                </form>
              ) : (
                /* Success Confirmation View */
                <div className="py-6 text-center space-y-4">
                  <div className="w-16 h-16 bg-[#BDDBD1]/50 text-[#2F3E3C] rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <Check className="w-8 h-8 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-[#2F3E3C]">Appointment Requested!</h4>
                    <p className="text-sm text-[#2F3E3C]/70 mt-1">
                      Your booking reference is <strong className="text-[#2F3E3C] font-mono text-base">{bookingRef}</strong>
                    </p>
                  </div>

                  <div className="bg-white/90 p-4 rounded-2xl border border-[#BDDBD1]/40 text-left text-sm space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[#2F3E3C]/60">Treatment:</span>
                      <strong className="text-[#2F3E3C]">{selectedServiceForModal.title}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#2F3E3C]/60">Date & Time:</span>
                      <strong className="text-[#2F3E3C]">{appointmentDate} at {appointmentTime}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#2F3E3C]/60">Patient:</span>
                      <strong className="text-[#2F3E3C]">{patientName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#2F3E3C]/60">Specialist:</span>
                      <span className="text-[#2F3E3C] font-medium">Certified MDS Specialist</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#2F3E3C]/70">
                    Saved to your Booking History! Our clinic desk will call or WhatsApp you shortly to confirm your slot.
                  </p>

                  <div className="pt-2 flex flex-col gap-2.5">
                    <GlowButton
                      onClick={handleWhatsAppConfirmation}
                      glowColor="rgba(255, 255, 255, 0.4)"
                      glowSize={180}
                      className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Send Instant Confirmation via WhatsApp</span>
                    </GlowButton>
                    <GlowButton
                      onClick={closeModal}
                      glowColor="rgba(45, 212, 191, 0.35)"
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#2F3E3C] to-[#3d524f] text-white font-semibold text-sm hover:brightness-110 transition-all cursor-pointer"
                    >
                      Done
                    </GlowButton>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </section>
  );
}
