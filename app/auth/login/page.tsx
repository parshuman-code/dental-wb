"use client";

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { validateEmail } from '@/lib/validation';
import { Stethoscope, Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/dashboard';
  const urlError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(
    urlError === 'auth_callback_failed'
      ? 'Authentication callback failed. Please try signing in again.'
      : ''
  );

  const supabase = createClient();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const emailVal = validateEmail(email);
    if (!emailVal.valid) {
      setErrorMsg(emailVal.error || 'Invalid email');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMsg('Invalid email or password. Please verify your credentials.');
        } else if (error.message.includes('Email not confirmed')) {
          setErrorMsg('Please verify your email address before signing in. Check your inbox for the confirmation link.');
        } else {
          setErrorMsg(error.message);
        }
        return;
      }

      if (data.user) {
        router.push(next);
        router.refresh();
      }
    } catch {
      setErrorMsg('A network error occurred. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setOauthLoading(true);

    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setOauthLoading(false);
      }
    } catch {
      setErrorMsg('Failed to initialize Google Sign In');
      setOauthLoading(false);
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
                Dental
              </span>
            </Link>
            <h1 className="text-3xl font-extrabold text-[#2F3E3C] tracking-tight">
              Welcome Back
            </h1>
            <p className="mt-2 text-sm text-[#2F3E3C]/70">
              Sign in to manage your appointments and treatment plans
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={100}>
          <div className="bg-gradient-to-br from-[#FBF9F1] via-white to-[#E8F0F1]/70 p-8 rounded-3xl shadow-xl border border-[#BDDBD1]/40 backdrop-blur-sm">
            {errorMsg && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-sm">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">{errorMsg}</div>
              </div>
            )}

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={oauthLoading || loading}
              className="w-full py-3 px-4 rounded-xl border border-[#BDDBD1]/50 bg-white hover:bg-slate-50 text-[#2F3E3C] font-semibold text-sm transition-all shadow-sm hover:shadow flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {oauthLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-[#2F3E3C]" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#BDDBD1]/30"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#FAF9F3] px-3 text-[#2F3E3C]/60 font-semibold tracking-wider">
                  Or with email
                </span>
              </div>
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
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

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-xs font-bold uppercase tracking-wider text-[#2F3E3C]/80"
                  >
                    Password
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs font-semibold text-[#2F3E3C]/70 hover:text-[#2F3E3C] underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2F3E3C]/40" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-2.5 bg-white/90 border border-[#BDDBD1]/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BDDBD1] text-[#2F3E3C] text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || oauthLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-[#2F3E3C] via-[#3d524f] to-[#2F3E3C] text-white hover:brightness-110 shadow-md shadow-[#2F3E3C]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-[#2F3E3C]/70">
              Don&apos;t have an account yet?{' '}
              <Link
                href={`/auth/register${next ? `?next=${encodeURIComponent(next)}` : ''}`}
                className="font-bold text-[#2F3E3C] hover:underline"
              >
                Create an account
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#2F3E3C]" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
