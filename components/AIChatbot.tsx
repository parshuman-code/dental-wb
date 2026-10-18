'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { X, Send, Sparkles, User, Lock } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome-1',
    role: 'model',
    content: "Namaste! ✨ I'm DenTo, your 24/7 AI Receptionist at Aura Dental Clinic. How can I help you today with treatments, tooth pain, or booking an appointment with Dr. Ananya Roy?",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if user is authenticated (treat null user as logged out)
  const isAuthenticated = !!user;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isClosing) {
      scrollToBottom();
      if (isAuthenticated) {
        inputRef.current?.focus();
      }
    }
  }, [isOpen, isClosing, messages, isLoading, isAuthenticated]);

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

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        content:
          data.reply ||
          "I'm here to assist! Please click 'Book Appointment' or ask me about any dental treatment.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content:
          "I'm experiencing a small delay. For severe tooth pain or emergency booking with Dr. Ananya Roy, please click 'Book Appointment' on our page!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    /* Absolutely fixed to viewport bottom-right corner with max z-index, immune to scrolling */
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
          className={`pointer-events-auto mb-3 w-[88vw] sm:w-[340px] h-[465px] max-h-[75vh] bg-white rounded-2xl shadow-[0_20px_50px_-10px_rgba(23,37,35,0.45)] border border-[#BDDBD1]/70 flex flex-col overflow-hidden relative ${
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
                  Aura Dental Clinic • Vashi
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
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
              <span>Dr. Ananya Roy (MDS) Desk</span>
            </div>
            <a
              href="#book"
              onClick={() => {
                const el = document.getElementById('book') || document.querySelector('a[href="/appointments"]');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-[11px] font-bold text-[#172523] hover:underline"
            >
              Book Visit →
            </a>
          </div>

          {/* Central Area: Messages + Shaded Glassmorphism Auth Overlay */}
          <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden bg-gradient-to-b from-[#FAF8F3] via-[#FFFFFF] to-[#EFF5F4]">
            {/* Background Chat Messages with Shaded Blur when logged out */}
            <div
              className={`flex-1 p-3 overflow-y-auto space-y-2.5 select-text transition-all duration-300 ${
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
                    className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Mascot / User Avatar */}
                    {isUser ? (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#172523] to-[#2D4541] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-white p-0.5 border border-[#BDDBD1] shadow-xs flex items-center justify-center shrink-0 overflow-hidden">
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
                      className={`max-w-[82%] rounded-xl px-3 py-2 text-xs leading-relaxed shadow-xs ${
                        isUser
                          ? 'bg-gradient-to-br from-[#1C2C29] via-[#243532] to-[#172523] text-white rounded-tr-none border border-[#2D4541]'
                          : 'bg-white text-[#152220] border border-[#BDDBD1]/70 rounded-tl-none font-medium'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
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

              {/* Lightweight Skeleton Loading UI */}
              {isLoading && (
                <div className="flex items-start gap-2 animate-in fade-in duration-200">
                  <div className="w-7 h-7 rounded-full bg-white p-0.5 border border-[#BDDBD1] shadow-xs flex items-center justify-center shrink-0 overflow-hidden">
                    <Image
                      src="/dento.png"
                      alt="DenTo"
                      width={28}
                      height={28}
                      className="w-full h-full object-contain animate-pulse"
                    />
                  </div>
                  <div className="bg-white border border-[#BDDBD1]/70 rounded-xl rounded-tl-none p-3 shadow-xs w-[75%] space-y-2">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      <span className="text-[10px] font-bold text-[#172523] uppercase tracking-wider">DenTo is typing</span>
                    </div>
                    {/* Shimmer skeleton bars */}
                    <div className="h-2.5 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-full w-full animate-pulse"></div>
                    <div className="h-2.5 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-full w-[85%] animate-pulse [animation-delay:150ms]"></div>
                    <div className="h-2.5 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-full w-[60%] animate-pulse [animation-delay:300ms]"></div>
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
                    You need to log in to use this feature and receive personalized 24/7 dental assistance.
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
            className={`p-2.5 bg-white border-t border-[#BDDBD1]/60 flex items-center gap-2 pointer-events-auto z-10 shrink-0 ${
              !isAuthenticated ? 'opacity-40 pointer-events-none' : ''
            }`}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isAuthenticated ? "Ask about treatments, pain, or appointments..." : "Please sign in to chat..."}
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
