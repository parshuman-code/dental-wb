"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { validatePassword } from '@/lib/validation';
import { Stethoscope, Lock, ArrowRight, AlertCircle, CheckCircle2, Loader2, Check } from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const supabase = createClient();

  const hasMinLength = password.length >= 8;
  const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const passVal = validatePassword(password);
    if (!passVal.valid) {
      setErrorMsg(passVal.error || 'Invalid password');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2500);
    } catch {
      setErrorMsg('A network error occurred. Please try again.');
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
              Set New Password
            </h1>
            <p className="mt-2 text-sm text-[#2F3E3C]/70">
              Create a strong new password for your account
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={100}>
          <div className="bg-gradient-to-br from-[#FBF9F1] via-white to-[#E8F0F1]/70 p-8 rounded-3xl shadow-xl border border-[#BDDBD1]/40 backdrop-blur-sm">
            {isSuccess ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-xl font-bold text-[#2F3E3C]">Password Updated!</h2>
                <p className="text-sm text-[#2F3E3C]/80">
                  Your new password has been set successfully. Redirecting you to your patient portal...
                </p>
                <div className="pt-2">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 font-bold text-sm text-[#2F3E3C] hover:underline"
                  >
                    Go to Portal Now <ArrowRight className="w-4 h-4" />
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

                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-xs font-bold uppercase tracking-wider text-[#2F3E3C]/80 mb-1.5"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2F3E3C]/40" />
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="At least 8 characters"
                        className="w-full pl-11 pr-4 py-2.5 bg-white/90 border border-[#BDDBD1]/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BDDBD1] text-[#2F3E3C] text-sm"
                      />
                    </div>

                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span
                          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                            hasMinLength ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                        <span className={hasMinLength ? 'text-emerald-700 font-medium' : 'text-[#2F3E3C]/60'}>
                          Minimum 8 characters
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span
                          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                            hasNumberOrSymbol ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                        <span className={hasNumberOrSymbol ? 'text-emerald-700 font-medium' : 'text-[#2F3E3C]/60'}>
                          Contains number or symbol
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-xs font-bold uppercase tracking-wider text-[#2F3E3C]/80 mb-1.5"
                    >
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2F3E3C]/40" />
                      <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Repeat your new password"
                        className="w-full pl-11 pr-4 py-2.5 bg-white/90 border border-[#BDDBD1]/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BDDBD1] text-[#2F3E3C] text-sm"
                      />
                    </div>
                    {confirmPassword && (
                      <p
                        className={`mt-1 text-[11px] font-medium ${
                          passwordsMatch ? 'text-emerald-700' : 'text-red-600'
                        }`}
                      >
                        {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !hasMinLength || !hasNumberOrSymbol || !passwordsMatch}
                    className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-[#2F3E3C] via-[#3d524f] to-[#2F3E3C] text-white hover:brightness-110 shadow-md shadow-[#2F3E3C]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <span>Save & Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
