"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, Clock, User, FileText, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy } from 'firebase/firestore';
import { checkIsDateHoliday, getNextAvailableWorkingDate, formatDisplayDate, type ClinicHoliday } from '@/lib/holidays';

import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import GlowButton from '@/components/GlowButton';
import AlarmTimePicker from '@/components/AlarmTimePicker';

const treatments = [
  { 
    id: 'general-dentistry', 
    name: 'General Checkup & Consultation',
    shortDesc: 'Routine oral examination, digital X-rays, and customized treatment plans.',
    detail: 'Ideal for catching hidden cavities early and getting expert doctor advice with zero pressure.'
  },
  { 
    id: 'scaling-cleaning', 
    name: 'Scaling & Teeth Cleaning',
    shortDesc: 'Ultrasonic removal of hardened tartar, plaque, and stubborn food stains.',
    detail: 'Keeps gums healthy, cures bad breath, and leaves your mouth feeling completely refreshed.'
  },
  { 
    id: 'endodontics', 
    name: 'Root Canal Treatment (RCT)',
    shortDesc: 'Painless cleaning of infected tooth nerves to save teeth from extraction.',
    detail: 'Single-visit, virtually painless therapy using computer-assisted rotary microscopes.'
  },
  { 
    id: 'cosmetic', 
    name: 'Teeth Whitening & Aesthetics',
    shortDesc: 'Brightens discolored or yellow teeth by up to 5-8 shades safely.',
    detail: 'Professional laser/gel dental whitening that restores a radiant, sparkling smile.'
  },
  { 
    id: 'orthodontics', 
    name: 'Braces & Clear Aligners',
    shortDesc: 'Straightens crooked, crowded teeth or gaps with invisible aligners.',
    detail: 'Modern smile design with discreet aligners or metal/ceramic braces for perfect alignment.'
  },
  { 
    id: 'implants', 
    name: 'Dental Implants',
    shortDesc: 'Permanent titanium artificial roots placed into jawbone for missing teeth.',
    detail: 'Looks, feels, and bites just like genuine natural teeth for a lifetime.'
  },
  { 
    id: 'surgery', 
    name: 'Wisdom Tooth & Surgical Extractions',
    shortDesc: 'Gentle, pain-free extraction of painful or impacted wisdom teeth.',
    detail: 'Carried out under local anesthesia with rapid same-day relief from severe jaw ache.'
  },
];

function BookAppointmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedService = searchParams.get('service');
  const { user, loading: authLoading, signInWithGoogle } = useAuth();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    treatment: preSelectedService || '',
    date: '',
    time: '09:00 AM',
    name: '',
    age: '',
    phone: '',
    notes: ''
  });
  const [showReview, setShowReview] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [autoSignPrompted, setAutoSignPrompted] = useState(false);
  const [holidays, setHolidays] = useState<ClinicHoliday[]>([]);

  // Real-time listener for clinic holidays
  useEffect(() => {
    const q = query(collection(db, 'holidays'), orderBy('startDate', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ClinicHoliday[] = snapshot.docs.map(d => ({
        id: d.id,
        startDate: d.data().startDate || '',
        endDate: d.data().endDate || d.data().startDate || '',
        reason: d.data().reason || 'Holiday / Clinic Closed',
      }));
      setHolidays(list);
    }, (err) => console.warn('Holidays listener error:', err));

    return () => unsubscribe();
  }, []);

  // Avoid hydration mismatch & prefill user details
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.displayName || '',
      }));
    }
  }, [user]);

  // When user lands on booking page and is not signed in, automatically offer Google Sign In.
  // If user cuts or refuses the sign in option, redirect them back to home.
  useEffect(() => {
    if (mounted && !authLoading && !user && !autoSignPrompted) {
      setAutoSignPrompted(true);
      signInWithGoogle().then((signedIn) => {
        if (!signedIn) {
          router.push('/');
        }
      });
    }
  }, [mounted, authLoading, user, autoSignPrompted, signInWithGoogle, router]);

  // Compute current date 'YYYY-MM-DD' to disallow past dates
  const todayStr = mounted ? new Date().toISOString().split('T')[0] : '';
  const isPastDate = formData.date && todayStr ? formData.date < todayStr : false;

  // Check if selected date falls under a clinic holiday
  const activeHoliday = checkIsDateHoliday(formData.date, holidays);
  const isHolidayDate = !!activeHoliday;
  const nextOpenDate = isHolidayDate ? getNextAvailableWorkingDate(formData.date, holidays) : '';

  const handleNext = () => setStep(s => Math.min(4, s + 1));
  const handlePrev = () => setStep(s => Math.max(1, s - 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPastDate) {
      alert('Please select today or a future date for your appointment.');
      return;
    }
    if (isHolidayDate) {
      alert(`The clinic is closed on ${formatDisplayDate(formData.date)} due to: ${activeHoliday.reason}. Please select another date.`);
      return;
    }
    if (!user) {
      const ok = await signInWithGoogle();
      if (!ok) {
        router.push('/');
        return;
      }
    }
    setShowReview(true);
  };

  const confirmSubmit = async () => {
    let currentUser = user;
    if (!currentUser) {
      const ok = await signInWithGoogle();
      if (!ok) {
        router.push('/');
        return;
      }
      currentUser = (await import('@/lib/firebase')).auth.currentUser;
    }

    if (!currentUser) {
      router.push('/');
      return;
    }

    setSubmitting(true);
    const refCode = `LD-${Math.floor(100000 + Math.random() * 900000)}`;
    setBookingRef(refCode);

    try {
      const appointmentData: Record<string, unknown> = {
        referenceCode: refCode,
        treatment: formData.treatment,
        date: formData.date,
        time: formData.time,
        patientName: formData.name,
        patientAge: formData.age,
        patientPhone: formData.phone,
        notes: formData.notes,
        status: 'Pending',
        doctor: 'MDS Specialist',
        createdAt: serverTimestamp(),
        uid: currentUser.uid,
        patientEmail: currentUser.email || '',
      };

      await addDoc(collection(db, 'appointments'), appointmentData);

      // Notify clinic owner via email asynchronously
      fetch('/api/notify-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: formData.name,
          phone: formData.phone,
          treatment: formData.treatment,
          date: formData.date,
          time: formData.time,
          bookingRef: refCode,
          notes: formData.notes || '',
          bookingTimestamp: new Date().toISOString(),
        }),
      }).catch(err => console.error('Failed to notify owner:', err));
    } catch (err) {
      console.error('Booking error:', err);
    } finally {
      setSubmitting(false);
      setShowReview(false);
      setIsSubmitted(true);
    }
  };

  if (!mounted) return null;

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-24 text-center">
        <div className="p-5 rounded-full bg-gradient-to-br from-[#E8F0F1] to-[#C7E7EC] shadow-lg mb-6">
          <CheckCircle2 className="w-20 h-20 text-[#2F3E3C]" />
        </div>
        <h1 className="text-4xl font-bold text-[#2F3E3C] mb-2">Request Received!</h1>
        <p className="text-xs font-mono font-bold text-[#2F3E3C]/60 uppercase tracking-widest mb-4">
          Booking Reference: <span className="text-[#2F3E3C] text-sm">{bookingRef}</span>
        </p>
        <p className="text-base sm:text-lg text-[#2F3E3C]/70 max-w-md mx-auto mb-8">
          Thank you, {formData.name}. We have received your appointment request for {formData.date} at {formData.time}. Our clinic team will contact you shortly.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-full font-bold text-sm bg-[#2F3E3C] text-white shadow-md hover:brightness-110"
          >
            View in Patient Portal
          </Link>
          <Link
            href="/booking-history"
            className="px-6 py-3 rounded-full font-semibold text-sm border border-[#BDDBD1]/50 bg-white/80 text-[#2F3E3C] hover:bg-white shadow-xs"
          >
            Check Booking History
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-gradient-to-b from-[#FBF9F1] via-white to-[#E8F0F1]/40 py-12 overflow-hidden">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 w-full">
        {/* Unauthenticated notification banner */}
        {!authLoading && !user && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50/90 border border-amber-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm text-amber-900 font-medium text-center sm:text-left">
              Please sign in with Google so your appointment is linked directly to your patient records and live history.
            </div>
            <GlowButton
              onClick={signInWithGoogle}
              glowColor="rgba(45, 212, 191, 0.4)"
              glowSize={120}
              className="px-4 py-2 rounded-xl bg-[#2F3E3C] text-white text-xs font-bold hover:brightness-110 shadow-xs whitespace-nowrap cursor-pointer"
            >
              Sign In
            </GlowButton>
          </div>
        )}

        <ScrollReveal direction="up">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[#2F3E3C] mb-4">Book Your Appointment</h1>
            <p className="text-[#2F3E3C]/70">Follow the steps below to schedule your visit.</p>
          </div>
        </ScrollReveal>

        {/* Step Indicator */}
        <ScrollReveal direction="up" delay={150}>
          <div className="flex items-center justify-between mb-12 relative">
            <div className="absolute left-0 top-1/2 w-full h-1 bg-[#E7E9E3] -z-10 -translate-y-1/2 rounded-full"></div>
            <div className="absolute left-0 top-1/2 h-1 bg-gradient-to-r from-[#2F3E3C] via-[#BDDBD1] to-[#C7E7EC] -z-10 -translate-y-1/2 rounded-full transition-all duration-300" style={{ width: (((step - 1) / 3) * 100) + '%' }}></div>
            
            {[1, 2, 3, 4].map((s) => {
              const stepClass = "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-sm " + (step >= s ? 'bg-gradient-to-br from-[#C7E7EC] to-[#BDDBD1] text-[#2F3E3C] shadow-md shadow-[#C7E7EC]/40 scale-105' : 'bg-[#E7E9E3] text-[#2F3E3C]/60');
              return (
                <div key={s} className={stepClass}>
                  {s}
                </div>
              );
            })}
          </div>
        </ScrollReveal>

        {/* Form Container */}
        <ScrollReveal direction="up" delay={250}>
          <div className="bg-gradient-to-br from-[#FBF9F1] via-white to-[#E8F0F1]/70 rounded-3xl p-8 shadow-xl border border-[#BDDBD1]/30 min-h-[400px] flex flex-col">
          
          {step === 1 && (
            <div className="flex-grow animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-bold text-[#2F3E3C] mb-6 flex items-center gap-2">
                <FileText className="text-[#2F3E3C]"/> Select Treatment
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {treatments.map(t => {
                  const isSelected = formData.treatment === t.name;
                  const btnClass = "p-4 rounded-xl border-2 text-left transition-all " + (isSelected ? 'border-[#2F3E3C] bg-gradient-to-r from-[#C7E7EC] via-[#BDDBD1] to-[#C7E7EC] shadow-md shadow-[#C7E7EC]/30 scale-[1.01]' : 'border-[#BDDBD1]/40 bg-white hover:border-[#2F3E3C]/50 hover:bg-[#FBF9F1]');
                  const spanClass = "font-bold text-sm sm:text-base " + (isSelected ? 'text-[#2F3E3C]' : 'text-slate-900');
                  return (
                    <button
                      key={t.id}
                      onClick={() => setFormData({...formData, treatment: t.name})}
                      className={btnClass}
                    >
                      <div className="flex flex-col gap-1">
                        <span className={spanClass}>{t.name}</span>
                        <p className="text-xs text-[#2F3E3C]/75 leading-relaxed font-normal">
                          {t.shortDesc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Informative Beginner-Friendly Description Card for Selected Treatment */}
              {formData.treatment && (
                <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-[#E8F0F1] via-[#FBF9F1] to-[#BDDBD1]/30 border border-[#BDDBD1]/50 shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-start gap-2.5">
                    <span className="text-lg">💡</span>
                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#2F3E3C]">
                        About {formData.treatment}:
                      </h4>
                      <p className="text-sm text-[#2F3E3C]/90 mt-1 font-medium leading-relaxed">
                        {treatments.find(t => t.name === formData.treatment)?.detail || 'Specialized clinical treatment tailored for optimal oral health and patient comfort.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="flex-grow animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-bold text-[#2F3E3C] mb-6 flex items-center gap-2">
                <Calendar className="text-[#2F3E3C]"/> Choose Date & Time
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Select Date</label>
                  <input 
                    type="date" 
                    min={todayStr}
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className={`w-full p-4 rounded-xl border-2 ${
                      isPastDate || isHolidayDate 
                        ? 'border-amber-400 bg-amber-50/30' 
                        : 'border-slate-300 bg-white'
                    } text-slate-950 font-semibold focus:border-[#2F3E3C] focus:ring-2 focus:ring-[#BDDBD1]/50 outline-none transition-colors shadow-xs`}
                  />
                  {isPastDate && (
                    <p className="text-xs font-bold text-red-600 mt-2 flex items-center gap-1">
                      ⚠️ Past dates cannot be booked. Please select today or an upcoming date.
                    </p>
                  )}
                  {isHolidayDate && activeHoliday && (
                    <div className="mt-3 p-3.5 bg-gradient-to-r from-amber-50 via-rose-50/40 to-amber-50 border-2 border-amber-300 rounded-xl shadow-xs animate-in fade-in duration-300">
                      <div className="flex items-start gap-2.5">
                        <span className="text-xl shrink-0">🏖️</span>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                            Clinic is closed on this date due to holiday
                          </p>
                          <p className="text-xs text-amber-900 font-medium">
                            <strong>Reason:</strong> {activeHoliday.reason}
                          </p>
                          {nextOpenDate && (
                            <div className="pt-1.5 flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-slate-700 font-semibold">
                                Suggested next working day: <strong className="text-emerald-800">{formatDisplayDate(nextOpenDate)}</strong>
                              </span>
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, date: nextOpenDate })}
                                className="px-2.5 py-1 bg-[#2F3E3C] hover:bg-[#1f2a28] active:scale-95 text-white text-[11px] font-bold rounded-lg transition-all shadow-xs cursor-pointer"
                              >
                                Select {formatDisplayDate(nextOpenDate)} →
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className={isHolidayDate ? 'opacity-40 pointer-events-none filter grayscale select-none' : ''}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-slate-900">
                      Preferred Time Slot {isHolidayDate && <span className="text-rose-600 text-xs font-bold">(Locked / Unavailable)</span>}
                    </label>
                  </div>
                  <AlarmTimePicker 
                    value={formData.time || '09:00 AM'} 
                    onChange={(newTime) => setFormData(prev => ({ ...prev, time: newTime }))} 
                  />
                  {isHolidayDate && (
                    <p className="text-xs font-bold text-rose-600 mt-2 flex items-center gap-1.5">
                      🔒 Slots are disabled because the clinic is closed on this date.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex-grow animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-bold text-[#2F3E3C] mb-6 flex items-center gap-2">
                <User className="text-[#2F3E3C]"/> Patient Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Full Name</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    className="w-full p-4 rounded-xl border-2 border-slate-300 bg-white text-slate-950 font-semibold placeholder:text-slate-400 focus:border-[#2F3E3C] focus:ring-2 focus:ring-[#BDDBD1]/50 outline-none transition-colors shadow-xs" 
                    placeholder="Enter full name" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">Age</label>
                    <input 
                      type="number" 
                      value={formData.age} 
                      onChange={(e) => setFormData({...formData, age: e.target.value})} 
                      className="w-full p-4 rounded-xl border-2 border-slate-300 bg-white text-slate-950 font-semibold placeholder:text-slate-400 focus:border-[#2F3E3C] focus:ring-2 focus:ring-[#BDDBD1]/50 outline-none transition-colors shadow-xs" 
                      placeholder="e.g. 28" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">Phone Number</label>
                    <input 
                      type="tel" 
                      value={formData.phone} 
                      onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                      className="w-full p-4 rounded-xl border-2 border-slate-300 bg-white text-slate-950 font-semibold placeholder:text-slate-400 focus:border-[#2F3E3C] focus:ring-2 focus:ring-[#BDDBD1]/50 outline-none transition-colors shadow-xs" 
                      placeholder="+91 98765 43210" 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex-grow animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-bold text-[#2F3E3C] mb-6 flex items-center gap-2">
                <FileText className="text-[#2F3E3C]"/> Additional Notes
              </h2>
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Medical History / Notes (Optional)</label>
                <textarea 
                  value={formData.notes} 
                  onChange={(e) => setFormData({...formData, notes: e.target.value})} 
                  className="w-full p-4 rounded-xl border-2 border-slate-300 bg-white text-slate-950 font-semibold placeholder:text-slate-400 focus:border-[#2F3E3C] focus:ring-2 focus:ring-[#BDDBD1]/50 outline-none transition-colors h-40 resize-none shadow-xs" 
                  placeholder="Any allergies, previous conditions, or specific concerns..."
                ></textarea>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-10 pt-6 border-t border-[#BDDBD1]/30">
            {step > 1 ? (
              <button onClick={handlePrev} className="px-6 py-3 rounded-xl font-semibold text-[#2F3E3C] bg-gradient-to-r from-[#FBF9F1] to-[#E8F0F1] hover:from-[#E8F0F1] hover:to-[#C7E7EC]/40 border border-[#BDDBD1]/40 shadow-sm transition-all flex items-center gap-2">
                <ChevronLeft className="w-4 h-4"/> Back
              </button>
            ) : <div></div>}

            {step < 4 ? (
              <button 
                onClick={handleNext}
                disabled={
                  (step === 1 && !formData.treatment) || 
                  (step === 2 && (!formData.date || !formData.time || isPastDate || isHolidayDate)) ||
                  (step === 3 && (!formData.name || !formData.age || !formData.phone))
                }
                className="px-7 py-3 rounded-xl font-semibold bg-gradient-to-r from-[#2F3E3C] via-[#3d524f] to-[#2F3E3C] text-white hover:brightness-110 shadow-md shadow-[#2F3E3C]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Continue <ChevronRight className="w-4 h-4"/>
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                className="px-8 py-3.5 rounded-xl font-semibold bg-gradient-to-r from-[#C7E7EC] via-[#BDDBD1] to-[#C7E7EC] hover:brightness-105 text-[#2F3E3C] shadow-lg shadow-[#C7E7EC]/40 transition-all transform hover:scale-105"
              >
                Review & Submit
              </button>
            )}
          </div>
        </div>
      </ScrollReveal>

        {/* Review Modal */}
        {showReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2F3E3C]/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-gradient-to-br from-[#FBF9F1] via-white to-[#E8F0F1]/80 rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-[#BDDBD1]/40">
              <h3 className="text-2xl font-bold text-[#2F3E3C] mb-6">Review Your Details</h3>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between border-b border-[#BDDBD1]/30 pb-2">
                  <span className="text-[#2F3E3C]/60">Treatment</span>
                  <span className="font-semibold text-[#2F3E3C] text-right">{formData.treatment}</span>
                </div>
                <div className="flex justify-between border-b border-[#BDDBD1]/30 pb-2">
                  <span className="text-[#2F3E3C]/60">Date & Time</span>
                  <span className="font-semibold text-[#2F3E3C]">{formData.date} at {formData.time}</span>
                </div>
                <div className="flex justify-between border-b border-[#BDDBD1]/30 pb-2">
                  <span className="text-[#2F3E3C]/60">Patient</span>
                  <span className="font-semibold text-[#2F3E3C]">{formData.name} ({formData.age}y)</span>
                </div>
                <div className="flex justify-between border-b border-[#BDDBD1]/30 pb-2">
                  <span className="text-[#2F3E3C]/60">Phone</span>
                  <span className="font-semibold text-[#2F3E3C]">{formData.phone}</span>
                </div>
                <div className="border-b border-[#BDDBD1]/30 pb-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-[#2F3E3C]/60">User Notes / Instructions</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#BDDBD1]/40 text-[#2F3E3C]">
                      {formData.notes?.trim() ? 'Included' : 'None'}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[#2F3E3C] bg-white/70 p-3 rounded-xl border border-[#BDDBD1]/30 whitespace-pre-wrap break-words italic">
                    {formData.notes?.trim() ? formData.notes : 'No custom notes or instructions specified.'}
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowReview(false)} className="flex-1 py-3 font-semibold text-[#2F3E3C] bg-gradient-to-r from-[#FBF9F1] to-[#E8F0F1] hover:from-[#E8F0F1] hover:to-[#C7E7EC]/40 border border-[#BDDBD1]/40 rounded-xl transition-all shadow-sm">Edit</button>
                <GlowButton onClick={confirmSubmit} glowColor="rgba(45, 212, 191, 0.45)" glowSize={180} className="flex-1 py-3 font-semibold text-[#2F3E3C] bg-gradient-to-r from-[#C7E7EC] via-[#BDDBD1] to-[#C7E7EC] hover:brightness-105 rounded-xl transition-all shadow-lg shadow-[#C7E7EC]/30">Confirm Booking</GlowButton>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function BookAppointmentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FBF9F1] to-[#E8F0F1]">Loading...</div>}>
      <BookAppointmentContent />
    </Suspense>
  );
}
