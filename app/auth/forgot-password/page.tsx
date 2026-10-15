"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { validateEmail } from '@/lib/validation';
import { Stethoscope, Mail, ArrowRight, AlertCircle, CheckCircle2, Loader2, ChevronLeft } from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSent, setIsSent] = useState(false);

  const supabase = createClient();

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const emailVal = validateEmail(email);
    if (!emailVal.valid) {
      setErrorMsg(emailVal.error || 'Please enter a valid email');
      return;
    }

    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/auth/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      setIsSent(true);
    } catch {
      setErrorMsg('A network error occurred. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#FBF9F1] via-white to-[#E8F0F1]/40">
      <div className="max-w-md w-full space-y-8">
        <ScrollReveal direction="up">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#E8F0F1] to-[#C7E7EC] text-[#2F3E3C] shadow-sm">
                <Stethoscope className="w-7 h-7" />
              </div>
              <span className="font-bold text-2xl text-[#2F3E3C] tracking-tight">
                Luminous Dental
              </span>
            </Link>
            <h1 className="text-3xl font-extrabold text-[#2F3E3C] tracking-tight">
              Reset Your Password
            </h1>
            <p className="mt-2 text-sm text-[#2F3E3C]/70">
              Enter your registered email and we&apos;ll send you a secure password reset link
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={100}>
          <div className="bg-gradient-to-br from-[#FBF9F1] via-white to-[#E8F0F1]/70 p-8 rounded-3xl shadow-xl border border-[#BDDBD1]/40 backdrop-blur-sm">
            {isSent ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-xl font-bold text-[#2F3E3C]">Password Reset Link Sent</h2>
                <p className="text-sm text-[#2F3E3C]/80 leading-relaxed">
                  We have dispatched a password recovery link to{' '}
                  <span className="font-bold text-[#2F3E3C]">{email}</span>. Click the link in the email to set a new password.
                </p>
                <div className="pt-4">
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-2 font-bold text-sm text-[#2F3E3C] hover:underline"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back to Sign In
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {errorMsg && (
                  <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-sm">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="flex-1">{errorMsg}</div>
                  </div>
                )}

                <form onSubmit={handleResetRequest} className="space-y-5">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-bold uppercase tracking-wider text-[#2F3E3C]/80 mb-1.5"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2F3E3C]/40" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="name@example.com"
                        className="w-full pl-11 pr-4 py-2.5 bg-white/90 border border-[#BDDBD1]/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BDDBD1] text-[#2F3E3C] text-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-[#2F3E3C] via-[#3d524f] to-[#2F3E3C] text-white hover:brightness-110 shadow-md shadow-[#2F3E3C]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Sending Link...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Password Reset Link</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center text-xs text-[#2F3E3C]/70">
                  Remembered your password?{' '}
                  <Link href="/auth/login" className="font-bold text-[#2F3E3C] hover:underline">
                    Back to Sign In
                  </Link>
                </div>
              </>
            )}
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
