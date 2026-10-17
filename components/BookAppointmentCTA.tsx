"use client";

import { useAuth } from '@/components/auth/AuthProvider';
import { ArrowRight } from 'lucide-react';

import GlowButton from '@/components/GlowButton';

interface BookAppointmentCTAProps {
  className?: string;
  children?: React.ReactNode;
}

export default function BookAppointmentCTA({
  className = "bg-gradient-to-r from-[#C7E7EC] via-[#BDDBD1] to-[#C7E7EC] hover:brightness-105 text-[#2F3E3C] px-8 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105 hover:shadow-xl hover:shadow-[#C7E7EC]/40 flex items-center gap-2 w-full sm:w-auto justify-center shadow-md cursor-pointer",
  children
}: BookAppointmentCTAProps) {
  const { user, signInWithGoogle } = useAuth();

  const handleClick = async () => {
    if (!user) {
      const ok = await signInWithGoogle();
      if (ok) {
        window.location.href = '/book-appointment';
      }
    } else {
      window.location.href = '/book-appointment';
    }
  };

  return (
    <GlowButton
      onClick={handleClick}
      glowColor="rgba(45, 212, 191, 0.45)"
      glowSize={160}
      className={className}
    >
      {children || (
        <>
          Book Appointment <ArrowRight className="w-5 h-5" />
        </>
      )}
    </GlowButton>
  );
}
