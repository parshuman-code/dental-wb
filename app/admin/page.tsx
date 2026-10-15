"use client";

import { useState, useEffect } from 'react';
import { Search, MessageCircle, Clock, CheckCircle, XCircle, LayoutDashboard, ShieldAlert, ArrowLeft } from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, orderBy, query, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/components/auth/AuthProvider';
import Link from 'next/link';

const OWNER_EMAIL = 'prashantgadwe142006@gmail.com';

interface Appointment {
  id: string;
  name: string;
  treatment: string;
  date: string;
  time: string;
  phone: string;
  status: string;
  patientEmail?: string;
  uid?: string;
}

export default function AdminDashboard() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const isOwner = user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();

  // Real-time Firestore listener for ALL appointments (only for owner)
  useEffect(() => {
    if (authLoading || !isOwner) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'appointments'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appts: Appointment[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        name: docSnap.data().patientName || 'Unknown',
        treatment: docSnap.data().treatment || '',
        date: docSnap.data().date || '',
        time: docSnap.data().time || '',
        phone: docSnap.data().patientPhone || '',
        status: docSnap.data().status || 'Pending',
        patientEmail: docSnap.data().patientEmail || '',
        uid: docSnap.data().uid || '',
      }));
      setAppointments(appts);
      setLoading(false);
    }, () => setLoading(false));

    return () => unsubscribe();
  }, [authLoading, isOwner]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'appointments', id), { status });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleWhatsApp = (appt: Appointment) => {
    const text = 'Hello ' + appt.name + ', this is Luminous Dental Clinic regarding your appointment for ' + appt.treatment + ' on ' + appt.date + ' at ' + appt.time + '. Please let us know if you have any questions.';
    const url = 'https://wa.me/' + appt.phone + '?text=' + encodeURIComponent(text);
    window.open(url, '_blank');
  };

  const getStatusIcon = (status: string) => {
    if (status === 'Confirmed') return <CheckCircle className="w-5 h-5 text-[#BDDBD1]" />;
    if (status === 'Pending') return <Clock className="w-5 h-5 text-amber-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FBF9F1] to-[#E8F0F1]">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 rounded-full border-3 border-[#2F3E3C] border-t-transparent animate-spin" />
          <p className="text-sm font-semibold text-[#2F3E3C]/70">Checking owner access...</p>
        </div>
      </div>
    );
  }

  // Unauthorized screen if user is not the owner
  if (!isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FBF9F1] via-white to-[#E8F0F1]/50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-red-100 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 text-red-600 mx-auto flex items-center justify-center mb-5 shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Restricted Access</h1>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            This management console is strictly under the Clinic Owner. Authorized administrative credentials are required to view patient records and live bookings.
          </p>

          {user ? (
            <div className="space-y-3">
              <p className="text-xs text-amber-800 font-medium bg-amber-50 py-2.5 px-3 rounded-xl border border-amber-200">
                Current account does not have owner administrative privileges.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  onClick={() => signInWithGoogle()}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#2F3E3C] text-white text-xs font-bold hover:brightness-110 shadow-xs cursor-pointer"
                >
                  Switch Account
                </button>
                <Link
                  href="/"
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back Home
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => signInWithGoogle()}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#2F3E3C] via-[#3d524f] to-[#2F3E3C] text-white text-sm font-bold hover:brightness-110 shadow-md cursor-pointer"
              >
                Owner Sign In
              </button>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Return to Home
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  const filteredAppts = appointments
    .filter(a => filter === 'All' || a.status === filter)
    .filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.treatment.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FBF9F1] via-white to-[#E8F0F1]/40 p-4 sm:p-8 font-sans overflow-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <ScrollReveal direction="up">
          <header className="bg-gradient-to-r from-[#FBF9F1] via-white to-[#E8F0F1] border border-[#BDDBD1]/30 rounded-2xl p-6 shadow-sm mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-[#2F3E3C] to-[#3d524f] rounded-2xl shadow-md">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#2F3E3C]">Admin Dashboard</h1>
                <p className="text-sm text-[#2F3E3C]/60">
                  Live appointments from Firestore
                  {loading && <span className="ml-2 inline-block w-3 h-3 rounded-full bg-amber-400 animate-pulse" />}
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#2F3E3C]/40" />
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/90 border border-[#BDDBD1]/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BDDBD1]"
                />
              </div>
            </div>
          </header>
        </ScrollReveal>

        {/* Filters */}
        <ScrollReveal direction="up" delay={150}>
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {['All', 'Pending', 'Confirmed', 'Cancelled'].map(f => {
              const isSelected = filter === f;
              const btnClass = "px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all " + (isSelected ? 'bg-gradient-to-r from-[#2F3E3C] via-[#3d524f] to-[#2F3E3C] text-white shadow-md shadow-[#2F3E3C]/30 scale-105' : 'bg-gradient-to-r from-[#FBF9F1] to-[#E8F0F1] text-[#2F3E3C]/70 hover:from-[#E8F0F1] hover:to-[#C7E7EC]/40 border border-[#BDDBD1]/30 shadow-sm');
              return (
                <button 
                  key={f} 
                  onClick={() => setFilter(f)}
                  className={btnClass}
                >
                  {f}
                  {f === 'All' && <span className="ml-1.5 text-[10px] opacity-70">({appointments.length})</span>}
                </button>
              );
            })}
          </div>
        </ScrollReveal>

        {/* Appointments Table/Cards */}
        <ScrollReveal direction="up" delay={250}>
          <div className="bg-gradient-to-b from-[#FBF9F1] via-white to-[#E8F0F1]/50 border border-[#BDDBD1]/30 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-[#E8F0F1] to-[#FBF9F1] border-b border-[#BDDBD1]/30 text-[#2F3E3C]/70 text-sm">
                  <th className="p-4 font-semibold">Patient</th>
                  <th className="p-4 font-semibold">Treatment</th>
                  <th className="p-4 font-semibold">Date & Time</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[#2F3E3C]/60">
                      <span className="inline-block w-5 h-5 rounded-full border-2 border-[#BDDBD1] border-t-transparent animate-spin mr-2" />
                      Loading real-time appointments...
                    </td>
                  </tr>
                ) : filteredAppts.map((appt) => {
                  let statusClass = "text-sm font-semibold ";
                  if (appt.status === 'Pending') statusClass += 'text-amber-600';
                  else if (appt.status === 'Confirmed') statusClass += 'text-[#2F3E3C] font-bold';
                  else statusClass += 'text-red-600';

                  return (
                    <tr key={appt.id} className="border-b border-[#BDDBD1]/20 hover:bg-white/60 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-[#2F3E3C]">{appt.name}</div>
                        <div className="text-xs text-[#2F3E3C]/60">{appt.patientEmail || (appt.phone && `+${appt.phone}`)}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-medium text-[#2F3E3C] bg-gradient-to-r from-[#E8F0F1] to-[#C7E7EC]/40 inline-block px-3 py-1 rounded-md border border-[#BDDBD1]/30">{appt.treatment}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-semibold text-[#2F3E3C]">{appt.date}</div>
                        <div className="text-xs text-[#2F3E3C]/60">{appt.time}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(appt.status)}
                          <span className={statusClass}>{appt.status}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          {appt.status === 'Pending' && (
                            <button onClick={() => updateStatus(appt.id, 'Confirmed')} className="p-2 bg-gradient-to-r from-[#C7E7EC] via-[#BDDBD1] to-[#C7E7EC] text-[#2F3E3C] hover:brightness-105 rounded-xl transition-all shadow-sm" title="Confirm">
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          )}
                          {appt.status !== 'Cancelled' && (
                            <button onClick={() => updateStatus(appt.id, 'Cancelled')} className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-all shadow-sm" title="Cancel">
                              <XCircle className="w-5 h-5" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleWhatsApp(appt)}
                            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:brightness-105 text-white rounded-xl transition-all text-sm font-semibold shadow-md shadow-[#25D366]/20"
                          >
                            <MessageCircle className="w-4 h-4" /> <span className="hidden sm:inline">WhatsApp</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loading && filteredAppts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[#2F3E3C]/60">
                      No appointments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </ScrollReveal>

      </div>
    </div>
  );
}


