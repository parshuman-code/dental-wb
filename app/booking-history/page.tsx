"use client";

import { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, Clock, Activity, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';

import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';

export default function BookingHistoryPage() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const [filter, setFilter] = useState('All');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    // Helper: ISO date string for today 'YYYY-MM-DD'
    const todayStr = new Date().toISOString().split('T')[0];

    if (user) {
      setLoading(true);
      // Query by user.uid only (no composite index required in Firestore)
      const q = query(
        collection(db, 'appointments'),
        where('uid', '==', user.uid)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const validAppts: any[] = [];

          snapshot.docs.forEach(docSnap => {
            const data = docSnap.data();
            const apptDate = data.date || '';

            // Auto-delete if appointment date is over (strictly before today)
            if (apptDate && apptDate < todayStr) {
              deleteDoc(doc(db, 'appointments', docSnap.id)).catch(err => {
                console.warn('Auto-delete past appointment error:', err);
              });
              return; // Do not include in user view
            }

            const createdAtMillis = data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt?.seconds ? data.createdAt.seconds * 1000 : 0);
            validAppts.push({
              id: docSnap.id,
              date: apptDate,
              time: data.time || '',
              treatment: data.treatment || '',
              doctor: data.doctor || 'MDS Specialist',
              status: data.status || 'Pending',
              createdAtMillis,
            });
          });

          // Sort descending in JavaScript (newest first)
          validAppts.sort((a, b) => {
            if (b.createdAtMillis !== a.createdAtMillis) {
              return b.createdAtMillis - a.createdAtMillis;
            }
            return (b.date || '').localeCompare(a.date || '');
          });

          setHistory(validAppts);
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching appointments:", error);
          setLoading(false);
          setHistory([]);
        }
      );

      return () => unsubscribe();
    } else {
      // Guest: check localStorage, remove expired bookings
      setLoading(false);
      try {
        const stored = localStorage.getItem('luminous_appointments');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter(item => !item.date || item.date >= todayStr);
            if (filtered.length !== parsed.length) {
              localStorage.setItem('luminous_appointments', JSON.stringify(filtered));
            }
            setHistory(filtered);
            return;
          }
        }
      } catch {
        // Ignore fallback
      }
      setHistory([]);
    }
  }, [user, authLoading]);

  const filteredHistory = filter === 'All' ? history : history.filter(h => 
    (filter === 'Upcoming' && (h.status === 'Pending' || h.status === 'Confirmed')) ||
    (filter === 'Past' && (h.status === 'Completed' || h.status === 'Cancelled'))
  );

  const handleDeleteCancelled = async (id: string) => {
    // Remove from React state immediately
    setHistory(prev => prev.filter(a => a.id !== id));

    if (user) {
      // Signed-in: permanently delete from Firestore
      try {
        await deleteDoc(doc(db, 'appointments', id));
      } catch (err) {
        console.error('Failed to delete cancelled appointment:', err);
      }
    } else {
      // Guest: remove from localStorage
      try {
        const stored = localStorage.getItem('luminous_appointments');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            localStorage.setItem(
              'luminous_appointments',
              JSON.stringify(parsed.filter((a: any) => a.id !== id))
            );
          }
        }
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FBF9F1] via-white to-[#E8F0F1]/40 py-12 overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <ScrollReveal direction="up">
          <div className="mb-8 text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#2F3E3C] mb-2">Booking History</h1>
              <p className="text-[#2F3E3C]/70">Track your past and upcoming dental appointments.</p>
            </div>
            {user ? (
              <Link
                href="/dashboard"
                className="self-start px-4 py-2 rounded-xl text-xs font-bold bg-[#2F3E3C] text-white hover:brightness-110 shadow-sm"
              >
                Go to Patient Portal →
              </Link>
            ) : (
              <button
                onClick={() => import('@/lib/firebase').then(({ auth, googleProvider }) => import('firebase/auth').then(({ signInWithPopup }) => signInWithPopup(auth, googleProvider)))}
                className="self-start px-4 py-2 rounded-xl text-xs font-bold bg-white/80 border border-[#BDDBD1]/50 text-[#2F3E3C] hover:bg-white shadow-xs"
              >
                Sign In to Sync Records →
              </button>
            )}
          </div>
        </ScrollReveal>

        {/* Filter Buttons */}
        <ScrollReveal direction="up" delay={150}>
          <div className="flex justify-center sm:justify-start gap-3 mb-8 pb-4">
            {['All', 'Upcoming', 'Past'].map(f => {
              const btnClass = filter === f 
                ? 'px-5 py-2.5 rounded-full font-semibold transition-all text-[#2F3E3C] bg-gradient-to-r from-[#C7E7EC] via-[#BDDBD1] to-[#C7E7EC] shadow-md shadow-[#C7E7EC]/40 scale-105' 
                : 'px-5 py-2.5 rounded-full font-semibold transition-all text-[#2F3E3C]/70 bg-gradient-to-r from-[#FBF9F1] to-[#E8F0F1] hover:from-[#E8F0F1] hover:to-[#C7E7EC]/40 border border-[#BDDBD1]/30 shadow-sm';
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={btnClass}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </ScrollReveal>

        {/* History List */}
        <div className="space-y-4">
          {filteredHistory.map((appt, idx) => {
            let iconClass = 'p-4 rounded-xl shrink-0 shadow-sm ';
            if (appt.status === 'Confirmed') iconClass += 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-800 border border-emerald-300';
            else if (appt.status === 'Completed') iconClass += 'bg-gradient-to-br from-[#E8F0F1] to-[#C7E7EC]/60 text-[#2F3E3C]';
            else if (appt.status === 'Pending') iconClass += 'bg-gradient-to-br from-amber-50 to-amber-100/80 text-amber-700 border border-amber-200';
            else iconClass += 'bg-gradient-to-br from-red-50 to-red-100/80 text-red-700 border border-red-200';

            let statusClass = 'font-bold text-sm ';
            if (appt.status === 'Confirmed') statusClass += 'text-emerald-700';
            else if (appt.status === 'Completed') statusClass += 'text-[#2F3E3C]';
            else if (appt.status === 'Pending') statusClass += 'text-amber-700';
            else statusClass += 'text-red-700';

            const isCancelled = appt.status === 'Cancelled';
            const isHovered = hoveredId === appt.id;

            return (
              <ScrollReveal key={appt.id} direction="up" delay={idx * 100}>
                <div
                  className="bg-gradient-to-br from-[#FBF9F1] via-white to-[#E8F0F1]/70 rounded-2xl p-6 shadow-sm border border-[#BDDBD1]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:shadow-md transition-shadow"
                  onMouseEnter={() => isCancelled && setHoveredId(appt.id)}
                  onMouseLeave={() => isCancelled && setHoveredId(null)}
                >
                  
                  <div className="flex items-start gap-4 w-full sm:w-auto">
                    <div className={iconClass}>
                      <CalendarIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#2F3E3C] mb-1">{appt.treatment}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#2F3E3C]/70">
                        <div className="flex items-center gap-1"><Clock className="w-4 h-4 text-[#2F3E3C]/60" /> {appt.date} at {appt.time}</div>
                        <div className="flex items-center gap-1"><Activity className="w-4 h-4 text-[#2F3E3C]/60" /> {appt.doctor}</div>
                      </div>
                    </div>
                  </div>

                  {/* Status badge */}
                  {isCancelled ? (
                    // Fixed-size pill so the overlay never changes the layout
                    <div
                      className="relative shrink-0"
                      style={{ width: 130, height: 36, overflow: 'hidden', borderRadius: 9999 }}
                    >
                      {/* Static badge content */}
                      <div
                        className="absolute inset-0 flex items-center justify-center gap-2 border border-red-200 bg-white/70 shadow-sm"
                        style={{ borderRadius: 9999 }}
                      >
                        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                        <span className={statusClass}>Cancelled</span>
                      </div>

                      {/* Dustbin overlay — slides in from right within the exact same box */}
                      <button
                        aria-label="Remove cancelled appointment"
                        onClick={() => handleDeleteCancelled(appt.id)}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#dc2626',
                          borderRadius: 9999,
                          transform: isHovered ? 'translateX(0%)' : 'translateX(101%)',
                          transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1)',
                          pointerEvents: isHovered ? 'auto' : 'none',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#BDDBD1]/40 bg-white/70 shadow-sm shrink-0 w-full sm:w-auto justify-center sm:justify-start">
                      {appt.status === 'Confirmed' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      {appt.status === 'Completed' && <CheckCircle2 className="w-4 h-4 text-[#BDDBD1]" />}
                      {appt.status === 'Pending' && <Clock className="w-4 h-4 text-amber-500" />}
                      <span className={statusClass}>{appt.status}</span>
                    </div>
                  )}
                </div>
              </ScrollReveal>
            );
          })}

          {filteredHistory.length === 0 && (
            <ScrollReveal direction="up">
              <div className="text-center py-12 bg-gradient-to-br from-[#FBF9F1] via-white to-[#E8F0F1]/70 rounded-2xl border border-[#BDDBD1]/30 shadow-sm">
                <CalendarIcon className="w-12 h-12 text-[#BDDBD1] mx-auto mb-4" />
                <h3 className="text-lg font-bold text-[#2F3E3C] mb-1">No appointments found</h3>
                <p className="text-[#2F3E3C]/60">You do not have any {filter.toLowerCase()} appointments.</p>
              </div>
            </ScrollReveal>
          )}
        </div>

      </div>
    </div>
  );
}
