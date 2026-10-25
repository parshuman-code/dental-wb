'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  X, 
  Send, 
  Sparkles, 
  User, 
  Lock, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  AlertCircle,
  Phone,
  FileText,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import AlarmTimePicker from '@/components/AlarmTimePicker';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy } from 'firebase/firestore';
import { ClinicHoliday, checkIsDateHoliday, getNextAvailableWorkingDate, formatDisplayDate } from '@/lib/holidays';

export interface TreatmentOption {
  id: string;
  name: string;
  shortDesc: string;
}

export const TREATMENTS: TreatmentOption[] = [
  { id: 'general-dentistry', name: 'General Checkup & Consultation', shortDesc: 'Routine checkup & advice' },
  { id: 'scaling-cleaning', name: 'Scaling & Teeth Cleaning', shortDesc: 'Ultrasonic plaque & stain removal' },
  { id: 'endodontics', name: 'Root Canal Treatment (RCT)', shortDesc: 'Painless single-visit tooth savior' },
  { id: 'cosmetic', name: 'Teeth Whitening & Aesthetics', shortDesc: 'Smile design & instant whitening' },
  { id: 'orthodontics', name: 'Braces & Clear Aligners', shortDesc: 'Invisible aligners & teeth straightening' },
  { id: 'implants', name: 'Dental Implants', shortDesc: 'Permanent titanium tooth roots' },
  { id: 'surgery', name: 'Wisdom Tooth & Surgical Extractions', shortDesc: 'Gentle, pain-free tooth extraction' },
];

export interface BookingState {
  step: 'treatment' | 'datetime' | 'details' | 'confirmed';
  treatment: string;
  date: string;
  time: string;
  patientName: string;
  patientPhone: string;
  patientAge: string;
  patientEmail: string;
  notes: string;
  bookingRef?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  recommendedTreatment?: string;
  bookingWidget?: {
    type: 'booking-flow';
    state: BookingState;
  };
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome-1',
    role: 'model',
    content: "Namaste! ✨ I'm DenTo, your 24/7 AI Receptionist at Aura Dental Clinic. How can I help you today with treatments, tooth pain, or booking an appointment with Dr. Ananya Roy?",
    timestamp: 'Just now',
  },
];

export default function AIChatbot() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [todayStr, setTodayStr] = useState('');

  // Active in-chat booking wizard state
  const [activeBooking, setActiveBooking] = useState<BookingState | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bookingCardRef = useRef<HTMLDivElement>(null);

  // Check if user is authenticated (treat null user as logged out)
  const isAuthenticated = !!user;

  const [holidays, setHolidays] = useState<ClinicHoliday[]>([]);

  // Listen to clinic holidays in real-time
  useEffect(() => {
    try {
      const q = query(collection(db, 'holidays'), orderBy('startDate', 'asc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const loaded: ClinicHoliday[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          loaded.push({
            id: docSnap.id,
            startDate: d.startDate,
            endDate: d.endDate,
            reason: d.reason,
            createdAt: d.createdAt,
          });
        });
        setHolidays(loaded);
      }, (err) => {
        console.warn('Holidays real-time sync notice:', err);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Failed to listen to holidays:', e);
    }
  }, []);

  useEffect(() => {
    // Safely compute on client mount to prevent SSR/prerender mismatch
    setTodayStr(new Date().toISOString().split('T')[0]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Focus chat input only on first open — never re-steal focus while user is typing
  const hasFocusedOnOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !isClosing) {
      scrollToBottom();
      // Only auto-focus the chat input once (when the widget first opens)
      // Never steal focus when a booking widget is active or user may already be typing
      if (isAuthenticated && !hasFocusedOnOpenRef.current && !activeBooking) {
        hasFocusedOnOpenRef.current = true;
        // Small delay so the pop-in animation completes first
        setTimeout(() => inputRef.current?.focus(), 180);
      }
    } else {
      hasFocusedOnOpenRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isClosing]);

  // Auto-scroll whenever new messages are added (e.g. after typing delay)
  useEffect(() => {
    if (isOpen && !isClosing) {
      scrollToBottom();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const handleOpen = () => {
    setIsClosing(false);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 270);
  };

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
    } catch (e) {
      console.error('Sign-in error from DenTo:', e);
    } finally {
      setIsSigningIn(false);
    }
  };

  // Map incoming treatment name/alias to our valid TREATMENTS list
  const matchTreatment = (nameOrKeyword: string): string => {
    if (!nameOrKeyword) return '';
    const clean = nameOrKeyword.trim().toLowerCase();
    
    // Direct or partial match on TREATMENTS
    const direct = TREATMENTS.find(t => 
      t.name.toLowerCase() === clean || 
      clean.includes(t.name.toLowerCase()) || 
      t.name.toLowerCase().includes(clean)
    );
    if (direct) return direct.name;

    // Keyword heuristic matching
    if (clean.includes('root canal') || clean.includes('rct') || clean.includes('pain') || clean.includes('nerve') || clean.includes('dard')) {
      return 'Root Canal Treatment (RCT)';
    }
    if (clean.includes('clean') || clean.includes('scaling') || clean.includes('tartar') || clean.includes('plaque') || clean.includes('khoon') || clean.includes('bleeding')) {
      return 'Scaling & Teeth Cleaning';
    }
    if (clean.includes('whiten') || clean.includes('aesthetic') || clean.includes('shine') || clean.includes('yellow') || clean.includes('peela') || clean.includes('cosmetic')) {
      return 'Teeth Whitening & Aesthetics';
    }
    if (clean.includes('brace') || clean.includes('align') || clean.includes('tedhe') || clean.includes('crooked')) {
      return 'Braces & Clear Aligners';
    }
    if (clean.includes('implant') || clean.includes('missing') || clean.includes('tooth replacement')) {
      return 'Dental Implants';
    }
    if (clean.includes('wisdom') || clean.includes('extract') || clean.includes('surgery') || clean.includes('akal')) {
      return 'Wisdom Tooth & Extractions';
    }
    if (clean.includes('checkup') || clean.includes('consult') || clean.includes('sensitivity')) {
      return 'General Checkup & Consultation';
    }

    return 'General Checkup & Consultation';
  };

  // Helper to start the in-chat booking flow with optional pre-filled treatment
  const startInChatBooking = (prefilledTreatment?: string) => {
    const today = new Date();
    // Default appointment date to tomorrow or today
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const matched = prefilledTreatment ? matchTreatment(prefilledTreatment) : '';

    const initialBooking: BookingState = {
      // If a treatment was matched and pre-filled, skip straight to date/time selection!
      step: matched ? 'datetime' : 'treatment',
      treatment: matched || '',
      date: dateStr,
      time: '10:00 AM',
      patientName: user?.displayName || '',
      patientEmail: user?.email || '',
      patientPhone: '',
      patientAge: '',
      notes: matched ? `[AI Recommended]: ${matched}` : '',
    };
    setActiveBooking(initialBooking);
  };

  // Client-side intent detection for booking on behalf / save time / help booking or agreeing
  const checkIsBookingIntent = (text: string) => {
    const lower = text.toLowerCase().trim();
    const triggers = [
      'book',
      'appointment',
      'schedule',
      'dont know how to book',
      "don't know how to book",
      'book for me',
      'book on my behalf',
      'save my time',
      'save time',
      'reserve a slot',
      'can you book',
      'fix an appointment',
      'slot',
      'treatment booking',
      'consultation',
      // Multi-language affirmation triggers
      'yes',
      'yes please',
      'yeah',
      'yup',
      'sure',
      'haan',
      'ha',
      'haanji',
      'kar do',
      'book kar do',
      'proceed',
      'book it',
      'ok book',
      'schedule it',
      'chale ga',
      'chalega',
      'ho',
      'nakki'
    ];
    return triggers.some(t => lower === t || lower.includes(t));
  };

  // Minimum time (ms) the typing indicator shows before the reply appears.
  // Prevents instant message pop that feels jarring and causes visual overlap.
  const MIN_TYPING_DELAY_MS = 900;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isAuthenticated) {
      handleSignIn();
      return;
    }

    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // Check if user specifically requested booking assistance or agreed
    const isLocalBookingIntent = checkIsBookingIntent(trimmed);

    // Record when we started so we can enforce min typing display time
    const requestStart = Date.now();

    try {
      const payloadMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payloadMessages }),
      });

      const data = await res.json();
      let rawReply: string = data.reply || "I'm here to assist! Please choose your preferred options.";

      // Extract recommendation tag if any: [[RECOMMEND_TREATMENT: <Treatment>]]
      let recommendedTreatment = '';
      const recMatch = rawReply.match(/\[\[RECOMMEND_TREATMENT:\s*([^\]]+)\]\]/i);
      if (recMatch && recMatch[1]) {
        recommendedTreatment = recMatch[1].trim();
      }

      // Extract booking signal tag if any: [[START_INCHAT_BOOKING: <Treatment>]] or [[START_INCHAT_BOOKING]]
      let bookingSignalTreatment = '';
      const bookingSignalMatch = rawReply.match(/\[\[START_INCHAT_BOOKING(?::\s*([^\]]+))?\]\]/i);
      const hasBookingSignal = !!bookingSignalMatch || (isLocalBookingIntent && !!recommendedTreatment);
      if (bookingSignalMatch && bookingSignalMatch[1]) {
        bookingSignalTreatment = bookingSignalMatch[1].trim();
      }

      // Clean out system signal tags from user-facing text
      const cleanReply = rawReply
        .replace(/\[\[START_INCHAT_BOOKING(?::\s*[^\]]+)?\]\]/gi, '')
        .replace(/\[\[RECOMMEND_TREATMENT:\s*[^\]]+\]\]/gi, '')
        .trim();

      // Ensure the typing indicator shows for at least MIN_TYPING_DELAY_MS
      // so messages don't overlap or appear instantly jarring
      const elapsed = Date.now() - requestStart;
      if (elapsed < MIN_TYPING_DELAY_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_TYPING_DELAY_MS - elapsed));
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        content: cleanReply || "I would be delighted to help you schedule your appointment with Dr. Ananya Roy right now!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recommendedTreatment: recommendedTreatment ? matchTreatment(recommendedTreatment) : undefined,
      };

      setMessages((prev) => [...prev, botMsg]);

      // Only open the form automatically if the user explicitly commanded booking
      // or the bot explicitly signaled START_INCHAT_BOOKING in response to an explicit booking request.
      // If it is just a symptom suggestion/recommendation, DO NOT auto-open the form:
      // The user will see the suggestion and can click "Proceed to Fill Form" when they wish.
      const shouldAutoOpen = !!bookingSignalMatch && !recommendedTreatment;
      if (shouldAutoOpen && (!activeBooking || activeBooking.step === 'confirmed')) {
        setTimeout(() => startInChatBooking(bookingSignalTreatment), 250);
      }
    } catch (err) {
      console.error('Chat error:', err);

      // Enforce minimum delay even on error so the typing indicator doesn't flash
      const elapsed = Date.now() - requestStart;
      if (elapsed < MIN_TYPING_DELAY_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_TYPING_DELAY_MS - elapsed));
      }

      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content:
          "I'm here with you! Let's get your appointment scheduled with Dr. Ananya Roy directly right here.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // In-Chat Booking Step Handlers
  // -------------------------------------------------------------
  const handleSelectTreatment = (treatmentName: string) => {
    if (!activeBooking) return;
    setActiveBooking({
      ...activeBooking,
      treatment: treatmentName,
      step: 'datetime',
    });
  };

  const handleConfirmDateTime = () => {
    if (!activeBooking) return;
    if (!activeBooking.date) {
      alert('Please select an appointment date.');
      return;
    }
    const holidayOnDate = checkIsDateHoliday(activeBooking.date, holidays);
    if (holidayOnDate) {
      alert(`The clinic is closed on this date due to holiday: ${holidayOnDate.reason}. Please select another date.`);
      return;
    }
    setActiveBooking({
      ...activeBooking,
      step: 'details',
    });
  };

  const handleFinalBookingSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeBooking || !user) return;

    if (!activeBooking.patientName.trim()) {
      alert('Please provide your name.');
      return;
    }
    if (!activeBooking.patientPhone.trim()) {
      alert('Please provide your contact phone number.');
      return;
    }

    try {
      setSubmittingBooking(true);
      const refCode = `LD-${Math.floor(100000 + Math.random() * 900000)}`;

      const appointmentData = {
        referenceCode: refCode,
        treatment: activeBooking.treatment,
        date: activeBooking.date,
        time: activeBooking.time,
        patientName: activeBooking.patientName,
        patientAge: activeBooking.patientAge || 'Not specified',
        patientPhone: activeBooking.patientPhone,
        notes: activeBooking.notes ? `[Booked via DenTo AI]: ${activeBooking.notes}` : '[Booked via DenTo AI Receptionist]',
        status: 'Pending',
        doctor: 'Dr. Ananya Roy (MDS)',
        createdAt: serverTimestamp(),
        uid: user.uid,
        patientEmail: user.email || activeBooking.patientEmail || '',
      };

      await addDoc(collection(db, 'appointments'), appointmentData);

      // Notify clinic owner via email asynchronously
      fetch('/api/notify-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: activeBooking.patientName,
          phone: activeBooking.patientPhone,
          treatment: activeBooking.treatment,
          date: activeBooking.date,
          time: activeBooking.time,
          bookingRef: refCode,
          notes: activeBooking.notes || 'Booked via DenTo AI Receptionist',
          bookingTimestamp: new Date().toISOString(),
        }),
      }).catch(err => console.error('Failed to notify owner:', err));

      // Transition to confirmed card
      setActiveBooking({
        ...activeBooking,
        step: 'confirmed',
        bookingRef: refCode,
      });

      // Add a celebratory bot message
      const confirmBotMsg: ChatMessage = {
        id: `bot-confirm-${Date.now()}`,
        role: 'model',
        content: `🎉 Excellent! Your appointment request for **${activeBooking.treatment}** on **${activeBooking.date} at ${activeBooking.time}** has been securely submitted to our front desk.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, confirmBotMsg]);

    } catch (err) {
      console.error('In-chat booking submission error:', err);
      alert('Unable to submit booking right now. Please try again or use the main booking page.');
    } finally {
      setSubmittingBooking(false);
    }
  };

  return (
    <aside 
      aria-label="DenTo AI Dental Assistant"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 99999,
        transform: 'none',
      }}
      className="flex flex-col items-end pointer-events-none select-none"
    >
      {/* Chat Window with Smooth Pop Animations - Compact Sleek Dimensions */}
      {isOpen && (
        <section
          role="dialog"
          aria-modal="true"
          aria-label="DenTo AI Receptionist Chat"
          className={`pointer-events-auto mb-3 w-[92vw] sm:w-[390px] h-[540px] max-h-[82vh] bg-white rounded-2xl shadow-[0_20px_50px_-10px_rgba(23,37,35,0.45)] border border-[#BDDBD1]/70 flex flex-col overflow-hidden relative ${
            isClosing ? 'dento-pop-out' : 'dento-pop-in'
          }`}
        >
          {/* Header with Dark Gradient & Crisp Visible Typography */}
          <header className="bg-gradient-to-r from-[#172523] via-[#243532] to-[#172523] text-white px-3.5 py-3 flex items-center justify-between border-b border-white/10 shadow-sm z-10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-white/10 p-0.5 border border-white/25 shadow-inner backdrop-blur-md flex items-center justify-center overflow-hidden">
                  <Image
                    src="/dento.png"
                    alt="DenTo 3D Mascot"
                    width={36}
                    height={36}
                    className="w-full h-full object-contain drop-shadow"
                    priority
                  />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-[#172523] rounded-full shadow-sm"></span>
              </div>
              <div>
                <h2 className="font-bold text-xs sm:text-sm tracking-wide flex items-center gap-1.5 text-white">
                  <span className="bg-gradient-to-r from-white via-[#E8F0F1] to-[#BDDBD1] bg-clip-text text-transparent">
                    DenTo
                  </span>
                  <span className="text-[10px] font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.2 rounded-full">
                    24/7 AI Desk
                  </span>
                </h2>
                <p className="text-[10px] text-[#D1E2DE] font-normal tracking-tight">
                  Aura Dental Clinic • Dr. Ananya Roy
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Quick booking button in header */}
              {isAuthenticated && !activeBooking && (
                <button
                  type="button"
                  onClick={() => startInChatBooking()}
                  className="px-2 py-1 bg-white/15 hover:bg-white/25 border border-white/20 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                  title="Book an appointment directly in chat"
                >
                  <Calendar className="w-3 h-3 text-[#BDDBD1]" />
                  <span>Book In-Chat</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleClose}
                className="w-7 h-7 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 rounded-full transition-all duration-200 active:scale-90 cursor-pointer"
                title="Close chat"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Quick Info Bar */}
          <div className="bg-[#EBF3F1] px-3.5 py-1.5 border-b border-[#BDDBD1]/50 flex items-center justify-between text-[11px] text-[#1E2D2A] z-10 shrink-0">
            <div className="flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Online Consultation & Booking</span>
            </div>
            <Link
              href="/book-appointment"
              className="text-[11px] font-bold text-[#172523] hover:underline"
            >
              Full Booking Page →
            </Link>
          </div>

          {/* Central Area: Messages + Shaded Glassmorphism Auth Overlay */}
          <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden bg-gradient-to-b from-[#FAF8F3] via-[#FFFFFF] to-[#EFF5F4]">
            {/* Background Chat Messages */}
            <div
              className={`flex-1 p-3 overflow-y-auto space-y-3 select-text transition-all duration-300 ${
                !isAuthenticated
                  ? 'filter blur-[4px] opacity-40 grayscale-[25%] pointer-events-none select-none'
                  : ''
              }`}
            >
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 chat-msg-smooth ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Mascot / User Avatar */}
                    {isUser ? (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#172523] to-[#2D4541] text-white flex items-center justify-center shrink-0 shadow-xs transition-transform hover:scale-105">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-white p-0.5 border border-[#BDDBD1] shadow-xs flex items-center justify-center shrink-0 overflow-hidden transition-transform hover:scale-105">
                        <Image
                          src="/dento.png"
                          alt="DenTo"
                          width={28}
                          height={28}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}

                    {/* Bubble */}
                    <div
                      className={`max-w-[84%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm transition-all duration-300 ${
                        isUser
                          ? 'bg-gradient-to-br from-[#1C2C29] via-[#243532] to-[#172523] text-white rounded-tr-none border border-[#2D4541]'
                          : 'bg-white text-[#152220] border border-[#BDDBD1]/70 rounded-tl-none font-medium'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>

                      {/* Intelligent Auto-Treatment Recommendation Card */}
                      {!isUser && msg.recommendedTreatment && (
                        <div className="mt-2.5 pt-2 border-t border-[#BDDBD1]/60">
                          <div className="bg-gradient-to-r from-[#EBF5F1] to-[#F2F8F6] rounded-lg p-2 border border-[#BDDBD1] flex flex-col gap-1.5 shadow-xs">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#172523]">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse shrink-0" />
                              <span>Recommended Treatment:</span>
                            </div>
                            <div className="text-[11px] font-extrabold text-[#172523]">
                              {msg.recommendedTreatment}
                            </div>
                            {(!activeBooking || activeBooking.step === 'confirmed') && (
                              <button
                                type="button"
                                onClick={() => startInChatBooking(msg.recommendedTreatment)}
                                className="mt-1 w-full py-2 px-3 bg-gradient-to-r from-[#172523] via-[#243532] to-[#172523] hover:brightness-110 active:scale-98 text-white text-[11px] font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-[#BDDBD1]/40"
                              >
                                <Calendar className="w-3.5 h-3.5 text-[#BDDBD1]" />
                                <span>Proceed to Fill Form →</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      <span
                        className={`block text-[9px] mt-1 text-right font-normal ${
                          isUser ? 'text-[#BDDBD1]' : 'text-gray-400'
                        }`}
                      >
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* ------------------------------------------------------------- */}
              {/* EMBEDDED IN-CHAT BOOKING WIDGET COMPONENT */}
              {/* ------------------------------------------------------------- */}
              {activeBooking && (
                <div 
                  ref={bookingCardRef}
                  tabIndex={-1}
                  className="animate-in fade-in slide-in-from-bottom-2 duration-300 my-2 relative z-20 outline-none"
                >
                  <div className="bg-gradient-to-br from-white via-[#FAFDFB] to-[#F2F8F6] border-2 border-[#2F3E3C]/20 rounded-2xl p-3.5 shadow-md">
                    
                    {/* Widget Header Banner */}
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#BDDBD1]/40">
                      <div className="flex items-center gap-1.5">
                        <div className="p-1 rounded-md bg-[#2F3E3C] text-white">
                          <Calendar className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-[#2F3E3C]">
                            {activeBooking.step === 'confirmed' ? 'Booking Confirmed' : 'Interactive In-Chat Booking'}
                          </div>
                          <div className="text-[9px] text-[#2F3E3C]/60">
                            {activeBooking.step === 'treatment' && 'Step 1 of 3: Choose Treatment'}
                            {activeBooking.step === 'datetime' && 'Step 2 of 3: Select Date & Time'}
                            {activeBooking.step === 'details' && 'Step 3 of 3: Confirm Patient Info'}
                            {activeBooking.step === 'confirmed' && 'Instant Appointment Record Created'}
                          </div>
                        </div>
                      </div>

                      {activeBooking.step !== 'confirmed' && (
                        <button
                          type="button"
                          onClick={() => setActiveBooking(null)}
                          className="text-gray-400 hover:text-gray-600 text-xs px-1.5 py-0.5 rounded hover:bg-gray-100 cursor-pointer"
                          title="Dismiss booking widget"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Step A: Treatment Selector Chips */}
                    {activeBooking.step === 'treatment' && (
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold text-[#2F3E3C]/90">
                          Please select your required dental treatment:
                        </p>
                        <div className="grid grid-cols-1 gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                          {TREATMENTS.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => handleSelectTreatment(t.name)}
                              className="w-full text-left p-2 rounded-xl border border-[#BDDBD1]/70 bg-white hover:bg-[#E8F0F1] hover:border-[#2F3E3C]/50 transition-all cursor-pointer group flex items-center justify-between"
                            >
                              <div>
                                <div className="text-xs font-bold text-[#2F3E3C] group-hover:text-emerald-950">
                                  {t.name}
                                </div>
                                <div className="text-[10px] text-[#2F3E3C]/60">
                                  {t.shortDesc}
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-[#2F3E3C]/40 group-hover:translate-x-0.5 transition-transform shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Step B: Date & Compact Time Wheel Picker */}
                    {activeBooking.step === 'datetime' && (() => {
                      const activeHoliday = checkIsDateHoliday(activeBooking.date, holidays);
                      const isHoliday = !!activeHoliday;
                      const nextDate = isHoliday ? getNextAvailableWorkingDate(activeBooking.date, holidays) : '';

                      return (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-[#2F3E3C]">
                              Selected: <span className="text-emerald-800">{activeBooking.treatment}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveBooking({ ...activeBooking, step: 'treatment' })}
                              className="text-[10px] text-[#2F3E3C]/70 underline hover:text-[#2F3E3C] flex items-center gap-0.5"
                            >
                              <RotateCcw className="w-2.5 h-2.5" /> Change
                            </button>
                          </div>

                          {/* Date Input */}
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#2F3E3C]/70 mb-1">
                              Appointment Date
                            </label>
                            <input
                              type="date"
                              min={todayStr}
                              value={activeBooking.date}
                              onChange={(e) => setActiveBooking({ ...activeBooking, date: e.target.value })}
                              className={`w-full text-xs font-medium px-2.5 py-1.5 bg-white border rounded-lg focus:outline-none focus:ring-1 text-[#2F3E3C] ${
                                isHoliday ? 'border-rose-400 bg-rose-50/40 focus:ring-rose-400' : 'border-[#BDDBD1] focus:ring-[#2F3E3C]'
                              }`}
                            />
                          </div>

                          {/* Holiday / Clinic Closed Notice */}
                          {isHoliday && activeHoliday && (
                            <div className="p-2.5 rounded-xl bg-gradient-to-r from-rose-50 via-rose-100/60 to-amber-50 border border-rose-300 shadow-xs animate-in fade-in duration-200">
                              <div className="flex items-start gap-2">
                                <span className="text-sm">🏖️</span>
                                <div className="space-y-1 text-[11px] leading-tight">
                                  <p className="font-bold text-rose-800">
                                    Clinic is closed on this date due to holiday:
                                  </p>
                                  <p className="text-rose-900 font-semibold italic">
                                    &ldquo;{activeHoliday.reason}&rdquo;
                                  </p>
                                  {nextDate && (
                                    <div className="pt-1 flex items-center justify-between gap-1">
                                      <span className="text-[10px] text-slate-700 font-medium">Next open working day:</span>
                                      <button
                                        type="button"
                                        onClick={() => setActiveBooking({ ...activeBooking, date: nextDate })}
                                        className="text-[10px] font-bold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded shadow-2xs transition-colors"
                                      >
                                        Select {formatDisplayDate(nextDate)} →
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Interactive Compact Alarm Wheel Picker */}
                          <div className={isHoliday ? 'opacity-40 pointer-events-none filter grayscale select-none' : ''}>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#2F3E3C]/70 mb-1">
                              Appointment Time {isHoliday && <span className="text-rose-600 font-bold lowercase">(locked)</span>}
                            </label>
                            <AlarmTimePicker
                              value={activeBooking.time}
                              onChange={(t) => setActiveBooking({ ...activeBooking, time: t })}
                            />
                            {isHoliday && (
                              <p className="text-[10px] font-semibold text-rose-600 mt-1">
                                🔒 Time slots are disabled for this holiday date.
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setActiveBooking({ ...activeBooking, step: 'treatment' })}
                              className="flex-1 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                            >
                              Back
                            </button>
                            <button
                              type="button"
                              disabled={isHoliday || !activeBooking.date}
                              onClick={handleConfirmDateTime}
                              className="flex-1 py-1.5 rounded-lg bg-[#2F3E3C] hover:bg-[#1f2a28] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1"
                            >
                              <span>Next: Patient Info</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Step C: Patient Details (Pre-filled from logged in user) */}
                    {activeBooking.step === 'details' && (
                      <form onSubmit={handleFinalBookingSubmit} autoComplete="off" className="space-y-2.5">
                        <div className="bg-[#EBF3F1]/70 p-2 rounded-lg text-[10px] text-[#2F3E3C] space-y-0.5 border border-[#BDDBD1]/50">
                          <div><strong>Treatment:</strong> {activeBooking.treatment}</div>
                          <div><strong>Date & Time:</strong> {activeBooking.date} at {activeBooking.time}</div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#2F3E3C]/80 mb-0.5">
                            Full Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="dento_patient_name"
                            id="dento_patient_name"
                            required
                            autoComplete="off"
                            autoCorrect="on"
                            autoCapitalize="words"
                            spellCheck={true}
                            value={activeBooking.patientName}
                            onChange={(e) => setActiveBooking({ ...activeBooking, patientName: e.target.value })}
                            placeholder="Patient's Full Name"
                            className="w-full text-xs font-medium px-2.5 py-1.5 bg-white border border-[#BDDBD1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2F3E3C] text-[#2F3E3C]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#2F3E3C]/80 mb-0.5">
                            Email (Pre-filled)
                          </label>
                          <input
                            type="text"
                            readOnly
                            tabIndex={-1}
                            autoComplete="off"
                            value={user?.email || activeBooking.patientEmail || ''}
                            className="w-full text-xs font-medium px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed select-none"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <label className="block text-[10px] font-bold text-[#2F3E3C]/80 mb-0.5">
                              Phone Number <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="tel"
                              name="dento_patient_phone"
                              id="dento_patient_phone"
                              required
                              autoComplete="off"
                              inputMode="numeric"
                              value={activeBooking.patientPhone}
                              onChange={(e) => {
                                // Only allow digits, +, spaces, dashes
                                const val = e.target.value.replace(/[^\d+\s\-]/g, '');
                                setActiveBooking({ ...activeBooking, patientPhone: val });
                              }}
                              placeholder="e.g. 9876543210"
                              className="w-full text-xs font-medium px-2.5 py-1.5 bg-white border border-[#BDDBD1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2F3E3C] text-[#2F3E3C]"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-[#2F3E3C]/80 mb-0.5">
                              Age
                            </label>
                            <input
                              type="text"
                              name="dento_patient_age"
                              id="dento_patient_age"
                              inputMode="numeric"
                              autoComplete="off"
                              value={activeBooking.patientAge}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                                setActiveBooking({ ...activeBooking, patientAge: val });
                              }}
                              placeholder="Age"
                              className="w-full text-xs font-medium px-2.5 py-1.5 bg-white border border-[#BDDBD1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2F3E3C] text-[#2F3E3C]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#2F3E3C]/80 mb-0.5">
                            Any symptoms or special notes?
                          </label>
                          <textarea
                            rows={2}
                            name="dento_patient_notes"
                            id="dento_patient_notes"
                            autoComplete="off"
                            autoCorrect="on"
                            spellCheck={true}
                            value={activeBooking.notes}
                            onChange={(e) => setActiveBooking({ ...activeBooking, notes: e.target.value })}
                            placeholder="Tooth pain, sensitivity, preferred doctor notes..."
                            className="w-full text-xs font-medium px-2.5 py-1.5 bg-white border border-[#BDDBD1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2F3E3C] text-[#2F3E3C] resize-none"
                          />
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setActiveBooking({ ...activeBooking, step: 'datetime' })}
                            className="flex-1 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                          >
                            Back
                          </button>
                          <button
                            type="submit"
                            disabled={submittingBooking}
                            className="flex-2 py-2 rounded-lg bg-gradient-to-r from-[#2F3E3C] to-[#1C2C29] hover:brightness-110 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            {submittingBooking ? (
                              <>
                                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                <span>Booking in Firestore...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Confirm & Submit Booking</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Step D: Confirmation Card with Instant Tracking Link */}
                    {activeBooking.step === 'confirmed' && (
                      <div className="text-center py-2 space-y-2.5">
                        <div className="w-10 h-10 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[#2F3E3C]">Appointment Request Received!</h4>
                          <p className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 py-0.5 px-2 rounded-md inline-block mt-1">
                            Reference: {activeBooking.bookingRef}
                          </p>
                        </div>

                        <div className="bg-white/80 border border-[#BDDBD1]/50 rounded-xl p-2.5 text-left text-[11px] text-[#2F3E3C] space-y-1">
                          <div><strong>Patient:</strong> {activeBooking.patientName}</div>
                          <div><strong>Treatment:</strong> {activeBooking.treatment}</div>
                          <div><strong>Scheduled:</strong> {activeBooking.date} at {activeBooking.time}</div>
                          <div><strong>Status:</strong> <span className="text-amber-600 font-bold">Pending Confirmation</span></div>
                        </div>

                        <div className="flex flex-col gap-1.5 pt-1">
                          <Link
                            href={`/booking-history?phone=${encodeURIComponent(activeBooking.patientPhone)}`}
                            className="w-full py-1.5 rounded-lg bg-[#2F3E3C] text-white text-xs font-bold hover:brightness-110 shadow-xs flex items-center justify-center gap-1"
                          >
                            <span>Track Appointment Status →</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => setActiveBooking(null)}
                            className="text-[11px] text-slate-500 hover:text-slate-700 py-1"
                          >
                            Close Booking Card
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Lightweight Animated Typing UI */}
              {isLoading && (
                <div className="flex items-start gap-2 animate-in fade-in duration-300 chat-msg-smooth">
                  <div className="w-7 h-7 rounded-full bg-white p-0.5 border border-[#BDDBD1] shadow-xs flex items-center justify-center shrink-0 overflow-hidden">
                    <Image
                      src="/dento.png"
                      alt="DenTo"
                      width={28}
                      height={28}
                      className="w-full h-full object-contain animate-bounce"
                    />
                  </div>
                  <div className="bg-white border border-[#BDDBD1]/70 rounded-xl rounded-tl-none px-3.5 py-2.5 shadow-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#172523] uppercase tracking-wider">DenTo is thinking</span>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0ms]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:180ms]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:360ms]"></span>
                      </div>
                    </div>
                    {/* Subtle shimmer skeleton bars */}
                    <div className="h-2 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-full w-44 animate-pulse"></div>
                    <div className="h-2 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-full w-32 animate-pulse [animation-delay:150ms]"></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Shaded Glassmorphism Auth Overlay - Displayed whenever user is not logged in */}
            {!isAuthenticated && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#172523]/25 via-white/70 to-white/90 backdrop-blur-md text-center animate-in fade-in duration-300">
                {/* Floating Modal Card */}
                <div className="w-full max-w-[280px] bg-white/95 rounded-2xl p-4 shadow-xl border border-white/80 flex flex-col items-center">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 mb-2.5 border border-white/60">
                    <Lock className="w-5 h-5 text-white" />
                  </div>

                  <h3 className="text-xs sm:text-[13px] font-bold text-gray-900 tracking-tight mb-1">
                    Sign in to chat with DenTo
                  </h3>
                  <p className="text-[11px] text-gray-600 leading-snug mb-3.5 px-1">
                    You need to log in to use this feature, chat with DenTo, and book appointments directly.
                  </p>

                  {/* Blue Sign In Button */}
                  <button
                    type="button"
                    onClick={handleSignIn}
                    disabled={isSigningIn}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-98 disabled:opacity-75 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-blue-500/30 transition-all duration-200 cursor-pointer"
                  >
                    {isSigningIn ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                        Signing in...
                      </span>
                    ) : (
                      <span>Sign In</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Input Area with High Contrast & Dark Palette */}
          <form
            onSubmit={handleSend}
            autoComplete="off"
            className={`p-2.5 bg-white border-t border-[#BDDBD1]/60 flex items-center gap-2 pointer-events-auto z-10 shrink-0 ${
              !isAuthenticated ? 'opacity-40 pointer-events-none' : ''
            }`}
          >
            <input
              ref={inputRef}
              type="text"
              name="dento_chat_msg"
              id="dento_chat_msg"
              autoComplete="off"
              autoCorrect="on"
              autoCapitalize="sentences"
              spellCheck={true}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isAuthenticated ? "Ask or say 'Book an appointment for me'..." : "Please sign in to chat..."}
              className="flex-1 text-xs bg-[#F5F8F7] border border-[#BDDBD1]/80 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#172523]/40 focus:border-[#172523] transition-all text-[#172523] font-medium placeholder-[#718883]"
              disabled={isLoading || !isAuthenticated}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim() || !isAuthenticated}
              className="bg-gradient-to-r from-[#172523] to-[#2B3E3B] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed text-white p-2.5 rounded-lg transition-all shadow-md hover:scale-105 active:scale-95 shrink-0 flex items-center justify-center cursor-pointer"
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </section>
      )}

      {/* Spherical 3D Mascot Floating Trigger in Bottom-Right Corner */}
      <div className="relative pointer-events-auto">
        {/* Helper Speech Bubble Preview (only when closed) */}
        {!isOpen && (
          <div
            onClick={handleOpen}
            className="absolute right-0 bottom-full mb-3 cursor-pointer group animate-bounce duration-1000"
          >
            <div className="bg-gradient-to-r from-[#172523] via-[#273B38] to-[#172523] text-white text-[11px] font-semibold px-3 py-1.5 rounded-full shadow-lg border border-white/20 whitespace-nowrap flex items-center gap-1.5 transition-transform group-hover:scale-105">
              <span>Chat with DenTo</span>
              <Sparkles className="w-3 h-3 text-[#BDDBD1]" />
            </div>
          </div>
        )}

        {/* Spherical Trigger Button */}
        <button
          onClick={isOpen ? handleClose : handleOpen}
          className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-[#14201E] via-[#2A3E3B] to-[#14201E] p-1 shadow-[0_12px_35px_-5px_rgba(20,32,30,0.55)] hover:shadow-[0_16px_40px_-5px_rgba(20,32,30,0.7)] border-2 border-white/70 hover:scale-110 active:scale-95 transition-all duration-300 dento-float flex items-center justify-center cursor-pointer group overflow-hidden"
          aria-label={isOpen ? 'Close DenTo AI Receptionist' : 'Open DenTo AI Receptionist'}
        >
          {/* Inner Glossy Sphere Highlight */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 via-transparent to-black/30 pointer-events-none"></div>

          {/* 3D Tooth Mascot from User Provided Image */}
          <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-white p-1 shadow-inner">
            <Image
              src="/dento.png"
              alt="DenTo 3D Tooth Character"
              width={76}
              height={76}
              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-md"
              priority
            />
          </div>

          {/* Live Online Badge */}
          <span className="absolute bottom-1 right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
          </span>
        </button>
      </div>
    </aside>
  );
}
