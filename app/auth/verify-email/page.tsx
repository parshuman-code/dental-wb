"use client";

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Stethoscope, Mail, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'your email';

  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const supabase = createClient();

  const handleResend = async () => {
    if (!email || email === 'your email') return;
    setResending(true);
    setResendStatus(null);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });

      if (error) {
        setResendStatus(error.message);
      } else {
        setResendStatus('Verification email resent! Please check your inbox.');
      }
    } catch {
      setResendStatus('Network error while resending. Please try again.');
    } finally {
      setResending(false);
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
              Verify Your Email
            </h1>
            <p className="mt-2 text-sm text-[#2F3E3C]/70">
              Almost there! Please verify your email to activate your account.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={100}>
          <div className="bg-gradient-to-br from-[#FBF9F1] via-white to-[#E8F0F1]/70 p-8 rounded-3xl shadow-xl border border-[#BDDBD1]/40 backdrop-blur-sm text-center space-y-5">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[#E8F0F1] to-[#C7E7EC] text-[#2F3E3C] flex items-center justify-center shadow-md">
              <Mail className="w-10 h-10 text-[#2F3E3C]" />
            </div>

            <div>
              <p className="text-sm text-[#2F3E3C]/80 leading-relaxed">
                We sent a confirmation link to:
              </p>
              <p className="font-bold text-[#2F3E3C] text-base mt-1 break-all">
                {email}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/80 border border-[#BDDBD1]/40 text-xs text-[#2F3E3C]/70 text-left space-y-2">
              <p className="flex items-center gap-2 font-semibold text-[#2F3E3C]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                Check your inbox and spam folder
              </p>
              <p className="flex items-center gap-2 font-semibold text-[#2F3E3C]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                Click the verification button to confirm
              </p>
            </div>

            {resendStatus && (
              <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                {resendStatus}
              </p>
            )}

            <div className="space-y-3 pt-2">
              <button
                onClick={handleResend}
                disabled={resending}
                className="w-full py-2.5 px-4 rounded-xl border border-[#BDDBD1]/50 bg-white hover:bg-slate-50 text-[#2F3E3C] font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {resending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Resending...</span>
                  </>
                ) : (
                  <span>Resend Verification Email</span>
                )}
              </button>

              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#2F3E3C] hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#2F3E3C]" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
