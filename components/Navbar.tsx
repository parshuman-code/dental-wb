"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Stethoscope, Menu, X, User, LogOut, LayoutDashboard, ChevronDown, ShieldCheck } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import Image from 'next/image';
import GlowButton from '@/components/GlowButton';

const OWNER_EMAIL = 'prashantgadwe142006@gmail.com';

const baseNavLinks = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Our Services', href: '/services' },
  { name: 'Booking History', href: '/booking-history' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Patient';
  const displayEmail = user?.email || '';
  const photoURL = user?.photoURL || null;

  return (
    <nav className="sticky top-0 z-50 w-full bg-gradient-to-r from-[#FBF9F1]/95 via-[#E8F0F1]/90 to-[#C7E7EC]/40 backdrop-blur-md shadow-sm border-b border-[#BDDBD1]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#E8F0F1] to-[#C7E7EC]/60 group-hover:from-[#C7E7EC] group-hover:to-[#BDDBD1] transition-all duration-300 shadow-sm">
                <Stethoscope className="h-6 w-6 text-[#2F3E3C]" />
              </div>
              <span className="font-bold text-xl text-[#2F3E3C] tracking-tight">Luminous Dental</span>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {baseNavLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={"relative py-2 font-medium transition-colors duration-200 group text-sm lg:text-base " + (active ? "text-[#2F3E3C] font-semibold" : "text-[#2F3E3C]/70 hover:text-[#2F3E3C]")}
                >
                  <span>{link.name}</span>
                  <span
                    className={"absolute bottom-0 left-0 h-[2.5px] rounded-full transition-all duration-300 ease-out " + (active ? "w-full bg-gradient-to-r from-[#2F3E3C] to-[#BDDBD1]" : "w-0 group-hover:w-full bg-gradient-to-r from-[#BDDBD1] to-[#C7E7EC]")}
                  />
                </Link>
              );
            })}

            {user ? (
              /* Authenticated User Menu — Avatar Logo Only */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="relative p-0.5 rounded-full hover:ring-2 hover:ring-[#BDDBD1] transition-all cursor-pointer focus:outline-none"
                  aria-label="User profile menu"
                  aria-expanded={userDropdownOpen}
                >
                  {photoURL ? (
                    <Image 
                      src={photoURL} 
                      alt={displayName} 
                      width={38} 
                      height={38} 
                      className="w-9 h-9 rounded-full object-cover shadow-sm border-2 border-white" 
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#BDDBD1] to-[#C7E7EC] text-[#2F3E3C] font-bold text-sm flex items-center justify-center shadow-sm border-2 border-white">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white/95 backdrop-blur-md shadow-xl border border-[#BDDBD1]/40 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2 border-b border-[#BDDBD1]/20">
                      <p className="text-xs font-bold text-[#2F3E3C] truncate">{displayName}</p>
                      <p className="text-[11px] text-[#2F3E3C]/60 truncate">{displayEmail}</p>
                    </div>

                    <Link
                      href="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#2F3E3C] hover:bg-[#E8F0F1]/60 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#BDDBD1]" />
                      <span>My Patient Portal</span>
                    </Link>

                    <Link
                      href="/booking-history"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#2F3E3C] hover:bg-[#E8F0F1]/60 transition-colors"
                    >
                      <User className="w-4 h-4 text-[#BDDBD1]" />
                      <span>Booking History</span>
                    </Link>

                    {user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase() && (
                      <Link
                        href="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-amber-900 bg-amber-50/70 hover:bg-amber-100/80 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        <span>Owner Clinic Admin</span>
                      </Link>
                    )}

                    <div className="border-t border-[#BDDBD1]/20 my-1" />

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        signOut();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Guest User: Google Sign In */
              <GlowButton
                onClick={signInWithGoogle}
                disabled={loading}
                glowColor="rgba(45, 212, 191, 0.4)"
                glowSize={120}
                className="flex items-center gap-2 text-sm font-semibold text-[#2F3E3C] hover:text-[#2F3E3C]/80 px-4 py-2 rounded-full border border-[#BDDBD1]/40 hover:bg-white/60 shadow-2xs disabled:opacity-60 cursor-pointer"
              >
                Sign In
              </GlowButton>
            )}

            <GlowButton
              onClick={async () => {
                if (!user) {
                  const ok = await signInWithGoogle();
                  if (ok) {
                    window.location.href = '/book-appointment';
                  }
                } else {
                  window.location.href = '/book-appointment';
                }
              }}
              glowColor="rgba(45, 212, 191, 0.45)"
              glowSize={140}
              className="bg-gradient-to-r from-[#C7E7EC] via-[#BDDBD1] to-[#C7E7EC] hover:brightness-105 text-[#2F3E3C] px-5 lg:px-6 py-2.5 rounded-full font-semibold text-sm hover:shadow-lg hover:shadow-[#C7E7EC]/40 shadow-sm cursor-pointer"
            >
              Book Appointment
            </GlowButton>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-[#2F3E3C]/80 hover:text-[#2F3E3C] hover:bg-white/50 focus:outline-none transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Subtle bottom gradient accent stripe */}
      <div className="h-[2px] w-full bg-gradient-to-r from-[#2F3E3C]/20 via-[#BDDBD1] to-[#C7E7EC]/70" />

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-gradient-to-b from-[#FBF9F1] to-[#E8F0F1] border-t border-[#BDDBD1]/30 shadow-lg mobile-menu-enter">
          <div className="px-3 pt-3 pb-4 space-y-1 sm:px-4">
            {user && (
              <div className="px-3 py-2 mb-2 rounded-xl bg-white/70 border border-[#BDDBD1]/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {photoURL ? (
                    <Image src={photoURL} alt={displayName} width={34} height={34} className="w-8 h-8 rounded-full object-cover shadow-xs border border-white" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#BDDBD1] to-[#C7E7EC] text-[#2F3E3C] font-bold text-xs flex items-center justify-center shadow-xs">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-[#2F3E3C]">{displayName}</p>
                    <p className="text-[10px] text-[#2F3E3C]/60">{displayEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase() && (
                    <Link
                      href="/admin"
                      onClick={() => setIsOpen(false)}
                      className="text-xs font-bold px-2.5 py-1 bg-amber-600 text-white rounded-lg shadow-xs"
                    >
                      Admin
                    </Link>
                  )}
                  <Link
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="text-xs font-bold px-3 py-1 bg-[#2F3E3C] text-white rounded-lg shadow-xs"
                  >
                    Portal
                  </Link>
                </div>
              </div>
            )}

            {baseNavLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={"block px-3 py-2.5 rounded-lg font-medium transition-colors " + (active ? "text-[#2F3E3C] bg-gradient-to-r from-[#E8F0F1] to-[#C7E7EC]/50 font-semibold border-l-4 border-[#2F3E3C]" : "text-[#2F3E3C]/70 hover:text-[#2F3E3C] hover:bg-white/60")}
                >
                  {link.name}
                </Link>
              );
            })}

            {user ? (
              <button
                onClick={() => {
                  setIsOpen(false);
                  signOut();
                }}
                className="w-full text-left px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                <span>Sign Out</span>
              </button>
            ) : (
              <GlowButton
                onClick={() => { setIsOpen(false); signInWithGoogle(); }}
                disabled={loading}
                glowColor="rgba(45, 212, 191, 0.35)"
                glowSize={120}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-[#2F3E3C] bg-white/80 border border-[#BDDBD1]/40 rounded-lg disabled:opacity-60 cursor-pointer"
              >
                Sign In
              </GlowButton>
            )}

            <GlowButton
              onClick={async () => {
                setIsOpen(false);
                if (!user) {
                  const ok = await signInWithGoogle();
                  if (ok) {
                    window.location.href = '/book-appointment';
                  }
                } else {
                  window.location.href = '/book-appointment';
                }
              }}
              glowColor="rgba(45, 212, 191, 0.45)"
              glowSize={160}
              className="w-full block px-3 py-2.5 text-[#2F3E3C] bg-gradient-to-r from-[#C7E7EC] via-[#BDDBD1] to-[#C7E7EC] hover:brightness-105 rounded-lg font-semibold mt-3 text-center shadow-sm cursor-pointer"
            >
              Book Appointment
            </GlowButton>
          </div>
        </div>
      )}
    </nav>
  );
}
