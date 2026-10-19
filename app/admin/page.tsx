"use client";

import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  LayoutDashboard, 
  ShieldAlert, 
  ArrowLeft, 
  Bell, 
  FileDown, 
  Download, 
  Calendar, 
  UserCheck, 
  AlertCircle,
  Sliders,
  Check,
  X,
  Trash2,
  AlertTriangle,
  FileText,
  MessageSquareQuote
} from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, orderBy, query, doc, updateDoc, limit, deleteDoc, writeBatch } from 'firebase/firestore';
import { useAuth } from '@/components/auth/AuthProvider';
import Link from 'next/link';
import AlarmTimePicker from '@/components/AlarmTimePicker';

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
  notes?: string;
}

export default function AdminDashboard() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [adjustingAppt, setAdjustingAppt] = useState<Appointment | null>(null);
  const [viewingNotesAppt, setViewingNotesAppt] = useState<Appointment | null>(null);
  const [selectedAdjustTime, setSelectedAdjustTime] = useState<string>('');
  const [pendingTimeChange, setPendingTimeChange] = useState<{ appt: Appointment; oldTime: string; newTime: string } | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const isOwner = user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();

  // Real-time Firestore listener for appointments with pagination/limit optimization
  useEffect(() => {
    if (authLoading || !isOwner) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'appointments'), orderBy('createdAt', 'desc'), limit(150));
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
        notes: docSnap.data().notes || '',
      }));
      setAppointments(appts);
      setLoading(false);
    }, () => setLoading(false));

    return () => unsubscribe();
  }, [authLoading, isOwner]);

  // Real-time pending count calculation
  const pendingCount = useMemo(() => {
    return appointments.filter(a => a.status === 'Pending').length;
  }, [appointments]);

  // Overall status statistics for reporting
  const stats = useMemo(() => {
    const pending = appointments.filter(a => a.status === 'Pending').length;
    const confirmed = appointments.filter(a => a.status === 'Confirmed').length;
    const cancelled = appointments.filter(a => a.status === 'Cancelled' || a.status === 'Cancelled by Patient').length;
    const completed = appointments.filter(a => a.status === 'Completed').length;
    return {
      total: appointments.length,
      pending,
      confirmed,
      cancelled,
      completed,
    };
  }, [appointments]);

  // Generate smart direct appointment tracking link using actual production domain
  const getTrackingLink = (appt: Appointment) => {
    // Dynamic production URL resolution: priority to deployed vercel domain
    let origin = 'https://dental-wb.vercel.app';
    if (typeof window !== 'undefined') {
      const currentHost = window.location.host;
      const isLocalhost = currentHost.includes('localhost') || currentHost.includes('127.0.0.1');
      if (!isLocalhost && window.location.origin) {
        origin = window.location.origin;
      }
    }
    const params = new URLSearchParams();
    params.set('id', appt.id);
    if (appt.uid) params.set('uid', appt.uid);
    if (appt.phone) params.set('phone', appt.phone);
    return `${origin}/booking-history?${params.toString()}`;
  };

  // Generate clean, natural notification message without unwanted special characters or symbols
  const getStatusNotificationMessage = (appt: Appointment, newStatus: string, modifiedTime?: string) => {
    const trackingUrl = getTrackingLink(appt);
    const activeTime = modifiedTime || appt.time;
    const isRescheduled = Boolean(modifiedTime && modifiedTime !== appt.time);

    if (newStatus === 'Confirmed') {
      if (isRescheduled) {
        return `Appointment Rescheduled and Confirmed\n\nDear ${appt.name},\nWe have rescheduled your appointment for ${appt.treatment} to ${activeTime} on ${appt.date} based on clinic availability.\n\nTrack your appointment here:\n${trackingUrl}\n\nIf you have any questions or need further adjustments, please feel free to contact us. We look forward to seeing you at Aura Dental Clinic.`;
      }
      return `Appointment Confirmed\n\nDear ${appt.name},\nYour appointment for ${appt.treatment} on ${appt.date} at ${activeTime} has been confirmed.\n\nTrack your appointment here:\n${trackingUrl}\n\nWe look forward to seeing you at Aura Dental Clinic.`;
    } else if (newStatus === 'Cancelled' || newStatus === 'Cancelled by Patient') {
      return `Appointment Cancellation Notice\n\nDear ${appt.name},\nYour appointment for ${appt.treatment} scheduled for ${appt.date} at ${activeTime} has been cancelled.\n\nTrack your appointment here:\n${trackingUrl}\n\nTo schedule a new date or discuss with our doctors, please visit our website or reply directly to this message. Thank you.`;
    }
    return `Hello ${appt.name}, your appointment for ${appt.treatment} on ${appt.date} is currently ${newStatus}.\n\nTrack your appointment here:\n${trackingUrl}`;
  };

  // Delete all appointments permanently from the database
  const handleDeleteAllAppointments = async () => {
    if (appointments.length === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete all ${appointments.length} appointment records from the database?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setIsDeletingAll(true);
      // Batch delete or parallel delete for Firestore
      const batch = writeBatch(db);
      appointments.forEach((appt) => {
        batch.delete(doc(db, 'appointments', appt.id));
      });
      await batch.commit();

      setAppointments([]);
    } catch (err) {
      console.error('Failed to delete all records:', err);
      alert('Failed to delete some records. Please check database permissions.');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const updateStatus = async (id: string, status: string, customTime?: string) => {
    try {
      // Find the appointment being updated
      const targetAppt = appointments.find(a => a.id === id);
      const effectiveTime = customTime || targetAppt?.time || '';

      // Optimistic update so the pending item immediately updates in UI & badge count decreases instantly
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status, time: effectiveTime } : a));

      const updateData: { status: string; lastUpdated: string; time?: string } = { 
        status,
        lastUpdated: new Date().toISOString()
      };
      if (customTime && customTime !== targetAppt?.time) {
        updateData.time = customTime;
      }

      await updateDoc(doc(db, 'appointments', id), updateData);

      // Automatically trigger WhatsApp notification with interactive smart tracking link if phone exists
      if (targetAppt && targetAppt.phone) {
        const text = getStatusNotificationMessage(targetAppt, status, customTime);
        const cleanPhone = targetAppt.phone.replace(/[^0-9]/g, '');
        const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleWhatsApp = (appt: Appointment) => {
    const text = getStatusNotificationMessage(appt, appt.status);
    const cleanPhone = appt.phone ? appt.phone.replace(/[^0-9]/g, '') : '';
    const url = 'https://wa.me/' + cleanPhone + '?text=' + encodeURIComponent(text);
    window.open(url, '_blank');
  };

  // Professional Business PDF Generation and Download
  const generatePDFReport = async () => {
    try {
      setIsExporting(true);
      const { jsPDF } = await import('jspdf');
      const autoTableModule = await import('jspdf-autotable');
      const autoTable = autoTableModule.default || autoTableModule;

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });

      const todayStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // ─── Header & Clinic Branding Banner ───
      doc.setFillColor(47, 62, 60); // Primary Brand Color #2F3E3C
      doc.rect(0, 0, 595.28, 85, 'F');

      // Clinic Name & Document Title
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('DENTAL CLINIC & SPECIALIST CARE', 40, 42);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(189, 219, 209); // Accent #BDDBD1
      doc.text('EXECUTIVE APPOINTMENT & PATIENT BOOKINGS REPORT', 40, 60);

      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(`Generated: ${todayStr}`, 440, 60);

      // ─── Executive Summary KPI Cards ───
      let yPos = 115;
      doc.setTextColor(47, 62, 60);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('Executive Booking Summary', 40, yPos);

      yPos += 12;

      // Draw Summary KPI Box
      doc.setFillColor(251, 249, 241); // #FBF9F1 background
      doc.setDrawColor(189, 219, 209);
      doc.roundedRect(40, yPos, 515, 62, 8, 8, 'FD');

      const colWidth = 515 / 4;
      const metrics = [
        { label: 'Total Bookings', value: stats.total.toString(), color: [47, 62, 60] },
        { label: 'Pending Requests', value: stats.pending.toString(), color: [217, 119, 6] }, // Amber
        { label: 'Confirmed / Active', value: (stats.confirmed + stats.completed).toString(), color: [16, 185, 129] }, // Green
        { label: 'Cancelled', value: stats.cancelled.toString(), color: [239, 68, 68] }, // Red
      ];

      metrics.forEach((m, idx) => {
        const x = 40 + idx * colWidth + 15;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(m.label, x, yPos + 22);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(m.color[0], m.color[1], m.color[2]);
        doc.text(m.value, x, yPos + 45);
      });

      yPos += 90;

      // ─── Historical Appointments Table ───
      doc.setTextColor(47, 62, 60);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('Detailed Patient Booking Records', 40, yPos);

      // Prepare table data
      const tableData = appointments.map((appt, i) => [
        (i + 1).toString(),
        appt.name || 'Anonymous',
        appt.phone ? `+${appt.phone}` : (appt.patientEmail || '-'),
        appt.treatment || 'Consultation',
        appt.notes ? appt.notes.trim() : '-',
        `${appt.date || 'TBD'} ${appt.time ? `@ ${appt.time}` : ''}`,
        appt.status || 'Pending',
      ]);

      (autoTable as any)(doc, {
        startY: yPos + 10,
        head: [['#', 'Patient Name', 'Contact', 'Treatment', 'Patient Notes', 'Scheduled Date', 'Status']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [47, 62, 60],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'left',
        },
        styles: {
          fontSize: 8,
          cellPadding: 5,
          textColor: [30, 41, 59],
        },
        columnStyles: {
          0: { cellWidth: 20, halign: 'center' },
          1: { cellWidth: 95, fontStyle: 'bold' },
          2: { cellWidth: 80 },
          3: { cellWidth: 95 },
          4: { cellWidth: 105, fontStyle: 'italic' },
          5: { cellWidth: 70 },
          6: { cellWidth: 50, fontStyle: 'bold', halign: 'center' },
        },
        didParseCell: (data: any) => {
          if (data.section === 'body' && data.column.index === 6) {
            const status = data.cell.raw;
            if (status === 'Confirmed' || status === 'Completed') {
              data.cell.styles.textColor = [16, 185, 129]; // Emerald
            } else if (status === 'Pending') {
              data.cell.styles.textColor = [217, 119, 6]; // Amber
            } else if (status === 'Cancelled' || status === 'Cancelled by Patient') {
              data.cell.styles.textColor = [239, 68, 68]; // Red
            }
          }
        },
        margin: { left: 40, right: 40, bottom: 40 },
      });

      // ─── Footer Page Numbers ───
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Dental Clinic Management System • Confidential • Page ${i} of ${pageCount}`,
          40,
          820
        );
      }

      // Download PDF directly
      doc.save(`Dental_Clinic_Bookings_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF report:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
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
    .filter(a => {
      if (filter === 'All') return true;
      if (filter === 'Cancelled') return a.status === 'Cancelled' || a.status === 'Cancelled by Patient';
      return a.status === filter;
    })
    .filter(a => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        a.name.toLowerCase().includes(s) || 
        a.treatment.toLowerCase().includes(s) ||
        (a.notes && a.notes.toLowerCase().includes(s)) ||
        (a.phone && a.phone.includes(s))
      );
    });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FBF9F1] via-white to-[#E8F0F1]/40 p-4 sm:p-8 font-sans overflow-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* Header with Real-Time Pending Notification Badge & Action Controls */}
        <ScrollReveal direction="up">
          <header className="bg-gradient-to-r from-[#FBF9F1] via-white to-[#E8F0F1] border border-[#BDDBD1]/30 rounded-2xl p-6 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className="p-3 bg-gradient-to-br from-[#2F3E3C] to-[#3d524f] rounded-2xl shadow-md text-white flex items-center justify-center">
                  <LayoutDashboard className="w-6 h-6" />
                </div>
                {/* Real-time Dynamic Notification Bell & Badge */}
                {pendingCount > 0 ? (
                  <span 
                    title={`${pendingCount} pending appointment requests need action`}
                    className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-1.5 text-[10px] font-extrabold text-white shadow-lg ring-2 ring-white animate-pulse"
                  >
                    {pendingCount}
                  </span>
                ) : null}
              </div>

              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-bold text-[#2F3E3C]">Clinic Owner Dashboard</h1>
                  {/* Visual Pending Badge in Title */}
                  {pendingCount > 0 ? (
                    <span 
                      onClick={() => setFilter('Pending')}
                      className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold hover:bg-amber-100 transition-colors shadow-xs"
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      {pendingCount} Pending Request{pendingCount > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-xs">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      All Requests Cleared
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#2F3E3C]/60 flex items-center gap-1.5 mt-0.5">
                  <span>Live bookings connected with Firestore</span>
                  {loading && <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />}
                </p>
              </div>
            </div>
            
            {/* Search Input & Download PDF Button */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#2F3E3C]/40" />
                <input
                  type="text"
                  placeholder="Search patient, phone, treatment..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white/90 border border-[#BDDBD1]/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BDDBD1] shadow-xs"
                />
              </div>

              {/* Download Report as PDF Button */}
              <button
                onClick={generatePDFReport}
                disabled={isExporting || appointments.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#2F3E3C] via-[#3d524f] to-[#2F3E3C] hover:brightness-110 active:scale-95 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md shadow-[#2F3E3C]/20 cursor-pointer"
                title="Download comprehensive historical booking report as PDF"
              >
                {isExporting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4 text-[#BDDBD1]" />
                    <span>Download Report as PDF</span>
                  </>
                )}
              </button>
            </div>
          </header>
        </ScrollReveal>

        {/* Live Executive KPI Cards */}
        <ScrollReveal direction="up" delay={100}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div 
              onClick={() => setFilter('All')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                filter === 'All' 
                  ? 'bg-white border-[#2F3E3C] shadow-md ring-2 ring-[#2F3E3C]/10' 
                  : 'bg-white/70 border-[#BDDBD1]/30 hover:bg-white hover:shadow-xs'
              }`}
            >
              <div className="text-xs font-semibold text-[#2F3E3C]/60 mb-1">Total Stored Bookings</div>
              <div className="text-2xl font-black text-[#2F3E3C]">{stats.total}</div>
              <div className="text-[11px] text-[#2F3E3C]/50 mt-1">Full database history</div>
            </div>

            <div 
              onClick={() => setFilter('Pending')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                filter === 'Pending' 
                  ? 'bg-amber-50/80 border-amber-400 shadow-md ring-2 ring-amber-400/20' 
                  : 'bg-white/70 border-[#BDDBD1]/30 hover:bg-white hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold text-amber-800 mb-1">
                <span>Action Needed (Pending)</span>
                {pendingCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
              </div>
              <div className="text-2xl font-black text-amber-600">{pendingCount}</div>
              <div className="text-[11px] text-amber-700/70 mt-1">Awaiting confirmation</div>
            </div>

            <div 
              onClick={() => setFilter('Confirmed')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                filter === 'Confirmed' 
                  ? 'bg-emerald-50/80 border-emerald-400 shadow-md ring-2 ring-emerald-400/20' 
                  : 'bg-white/70 border-[#BDDBD1]/30 hover:bg-white hover:shadow-xs'
              }`}
            >
              <div className="text-xs font-semibold text-emerald-800 mb-1">Confirmed / Active</div>
              <div className="text-2xl font-black text-emerald-700">{stats.confirmed + stats.completed}</div>
              <div className="text-[11px] text-emerald-700/70 mt-1">Scheduled appointments</div>
            </div>

            <div 
              onClick={() => setFilter('Cancelled')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                filter === 'Cancelled' 
                  ? 'bg-rose-50/80 border-rose-400 shadow-md ring-2 ring-rose-400/20' 
                  : 'bg-white/70 border-[#BDDBD1]/30 hover:bg-white hover:shadow-xs'
              }`}
            >
              <div className="text-xs font-semibold text-rose-800 mb-1">Cancelled Requests</div>
              <div className="text-2xl font-black text-rose-600">{stats.cancelled}</div>
              <div className="text-[11px] text-rose-700/70 mt-1">Declined or aborted</div>
            </div>
          </div>
        </ScrollReveal>

        {/* Filters */}
        <ScrollReveal direction="up" delay={150}>
          <div className="flex items-center justify-between gap-2 mb-6 overflow-x-auto pb-2">
            <div className="flex gap-2">
              {['All', 'Pending', 'Confirmed', 'Cancelled'].map(f => {
                const isSelected = filter === f;
                const count = f === 'All' 
                  ? appointments.length 
                  : f === 'Cancelled'
                  ? appointments.filter(a => a.status === 'Cancelled' || a.status === 'Cancelled by Patient').length
                  : appointments.filter(a => a.status === f).length;

                const btnClass = "px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 " + (
                  isSelected 
                    ? 'bg-gradient-to-r from-[#2F3E3C] via-[#3d524f] to-[#2F3E3C] text-white shadow-md shadow-[#2F3E3C]/30 scale-105' 
                    : 'bg-gradient-to-r from-[#FBF9F1] to-[#E8F0F1] text-[#2F3E3C]/70 hover:from-[#E8F0F1] hover:to-[#C7E7EC]/40 border border-[#BDDBD1]/30 shadow-xs'
                );

                return (
                  <button 
                    key={f} 
                    onClick={() => setFilter(f)}
                    className={btnClass}
                  >
                    <span>{f}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected 
                        ? 'bg-white/20 text-white' 
                        : f === 'Pending' && count > 0 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-slate-200 text-slate-700'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              {appointments.length > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteAllAppointments}
                  disabled={isDeletingAll}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200/80 active:scale-95 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                  title="Permanently delete all stored appointment records"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>{isDeletingAll ? 'Deleting...' : 'Delete All 🗑️'}</span>
                </button>
              )}

              <div className="text-xs text-[#2F3E3C]/60 hidden sm:block font-medium">
                Showing <span className="font-bold text-[#2F3E3C]">{filteredAppts.length}</span> of {appointments.length} records
              </div>
            </div>
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
                  <th className="p-4 font-semibold">Patient Notes</th>
                  <th className="p-4 font-semibold">Date & Time</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#2F3E3C]/60">
                      <span className="inline-block w-5 h-5 rounded-full border-2 border-[#BDDBD1] border-t-transparent animate-spin mr-2" />
                      Loading real-time appointments...
                    </td>
                  </tr>
                ) : filteredAppts.map((appt) => {
                  let statusClass = "text-sm font-semibold ";
                  const isPatientCancelled = appt.status === 'Cancelled by Patient';
                  const isAnyCancelled = appt.status === 'Cancelled' || isPatientCancelled;

                  if (appt.status === 'Pending') statusClass += 'text-amber-600';
                  else if (appt.status === 'Confirmed') statusClass += 'text-[#2F3E3C] font-bold';
                  else if (isPatientCancelled) statusClass += 'text-rose-700 font-bold';
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
                      <td className="p-4 max-w-[240px]">
                        {appt.notes && appt.notes.trim() ? (
                          <div 
                            onClick={() => setViewingNotesAppt(appt)}
                            className="group cursor-pointer p-2 rounded-xl bg-amber-50/80 hover:bg-amber-100/90 border border-amber-200/80 transition-all shadow-2xs hover:shadow-xs"
                            title="Click to view full notes"
                          >
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 mb-0.5">
                              <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>Patient Note</span>
                            </div>
                            <p className="text-xs text-amber-950/85 line-clamp-2 italic leading-snug">
                              &quot;{appt.notes}&quot;
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No notes provided</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-semibold text-[#2F3E3C]">{appt.date}</div>
                        <div className="text-xs text-[#2F3E3C]/60">{appt.time}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(appt.status)}
                          <span className={statusClass}>
                            {isPatientCancelled ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
                                Cancelled by Patient
                              </span>
                            ) : (
                              appt.status
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          {appt.status === 'Pending' && (
                            <>
                              <button 
                                onClick={() => updateStatus(appt.id, 'Confirmed')} 
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:brightness-110 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer" 
                                title="Accept & Confirm at Requested Time"
                              >
                                <CheckCircle className="w-4 h-4" />
                                <span>Accept</span>
                              </button>
                              <button 
                                onClick={() => {
                                  setAdjustingAppt(appt);
                                  setSelectedAdjustTime(appt.time || '10:00 AM');
                                }} 
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer" 
                                title="Modify Time Slot & Reschedule"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                                <span>Adjust Time</span>
                              </button>
                              <button 
                                onClick={() => updateStatus(appt.id, 'Cancelled')} 
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 active:scale-95 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer" 
                                title="Reject Booking Request"
                              >
                                <XCircle className="w-4 h-4" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}
                          {appt.status === 'Confirmed' && (
                            <button 
                              onClick={() => updateStatus(appt.id, 'Completed')} 
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer" 
                              title="Mark Treatment as Completed"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Complete</span>
                            </button>
                          )}
                          {!isAnyCancelled && appt.status !== 'Pending' && (
                            <button 
                              onClick={() => updateStatus(appt.id, 'Cancelled')} 
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" 
                              title="Cancel Appointment"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleWhatsApp(appt)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:brightness-105 active:scale-95 text-white rounded-xl transition-all text-xs font-bold shadow-md shadow-[#25D366]/20 cursor-pointer"
                            title="Chat with Patient on WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> 
                            <span className="hidden sm:inline">WhatsApp</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loading && filteredAppts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#2F3E3C]/60">
                      No appointments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </ScrollReveal>

      {/* Patient Notes Quick View Modal */}
      {viewingNotesAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2F3E3C]/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gradient-to-br from-[#FBF9F1] via-white to-[#E8F0F1] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-[#BDDBD1]/50 relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setViewingNotesAppt(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close notes modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#2F3E3C]">Patient Instructions & Notes</h3>
                <p className="text-xs text-[#2F3E3C]/60">Submitted during appointment booking</p>
              </div>
            </div>

            <div className="bg-white/90 rounded-2xl p-4 border border-[#BDDBD1]/40 space-y-2 mb-4 text-xs text-slate-700">
              <div className="flex justify-between border-b border-[#BDDBD1]/20 pb-1.5">
                <span className="font-semibold text-slate-500">Patient Name:</span>
                <span className="font-bold text-[#2F3E3C]">{viewingNotesAppt.name}</span>
              </div>
              <div className="flex justify-between border-b border-[#BDDBD1]/20 pb-1.5">
                <span className="font-semibold text-slate-500">Selected Treatment:</span>
                <span className="font-bold text-[#2F3E3C]">{viewingNotesAppt.treatment}</span>
              </div>
              <div className="flex justify-between border-b border-[#BDDBD1]/20 pb-1.5">
                <span className="font-semibold text-slate-500">Date & Time:</span>
                <span className="font-bold text-[#2F3E3C]">{viewingNotesAppt.date} at {viewingNotesAppt.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Phone Contact:</span>
                <span className="font-bold text-[#2F3E3C]">{viewingNotesAppt.phone ? `+${viewingNotesAppt.phone}` : 'N/A'}</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2F3E3C]/80 mb-2">
                Patient Message / Medical Notes:
              </label>
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-sm text-[#2F3E3C] leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                {viewingNotesAppt.notes || 'No custom notes provided.'}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setViewingNotesAppt(null)}
                className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-[#2F3E3C] bg-white border border-[#BDDBD1]/60 hover:bg-[#FBF9F1] transition-all cursor-pointer shadow-xs"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const appt = viewingNotesAppt;
                  setViewingNotesAppt(null);
                  handleWhatsApp(appt);
                }}
                className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:brightness-105 transition-all shadow-md shadow-[#25D366]/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Reply on WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Time Adjustment Modal */}
      {adjustingAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2F3E3C]/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gradient-to-br from-[#FBF9F1] via-white to-[#E8F0F1] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#BDDBD1]/50 relative animate-in zoom-in-95 duration-200">
            
            {/* Close button */}
            <button 
              onClick={() => setAdjustingAppt(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#2F3E3C] to-[#3d524f] text-white flex items-center justify-center shadow-sm">
                <Sliders className="w-5 h-5 text-[#BDDBD1]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#2F3E3C]">Adjust Appointment Time</h3>
                <p className="text-xs text-[#2F3E3C]/70">Modify slot based on clinic chair availability</p>
              </div>
            </div>

            {/* Appointment Brief */}
            <div className="p-3.5 rounded-2xl bg-[#E8F0F1]/60 border border-[#BDDBD1]/40 mb-5 text-xs text-[#2F3E3C]">
              <div className="flex justify-between py-1">
                <span className="font-semibold text-slate-600">Patient:</span>
                <span className="font-bold text-[#2F3E3C]">{adjustingAppt.name}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-semibold text-slate-600">Treatment:</span>
                <span className="font-bold text-[#2F3E3C]">{adjustingAppt.treatment}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-semibold text-slate-600">Date:</span>
                <span className="font-bold text-[#2F3E3C]">{adjustingAppt.date}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-semibold text-slate-600">Requested Time:</span>
                <span className="font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">
                  {adjustingAppt.time}
                </span>
              </div>
              {adjustingAppt.notes && (
                <div className="pt-2 mt-2 border-t border-[#BDDBD1]/30">
                  <span className="font-semibold text-slate-600 block mb-1">Patient Notes:</span>
                  <p className="italic text-slate-700 bg-white/80 p-2 rounded-lg border border-[#BDDBD1]/30">
                    {adjustingAppt.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Alarm Time Picker for Adjustment */}
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2F3E3C]/80 mb-2">
                Select Rescheduled Time Slot
              </label>
              <AlarmTimePicker 
                value={selectedAdjustTime || adjustingAppt.time || '10:00 AM'}
                onChange={(newTime) => setSelectedAdjustTime(newTime)}
              />
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setAdjustingAppt(null)}
                className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-[#2F3E3C] bg-white border border-[#BDDBD1]/60 hover:bg-[#FBF9F1] transition-all cursor-pointer shadow-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = adjustingAppt;
                  const newTime = selectedAdjustTime || target.time;
                  const oldTime = target.time || 'Unspecified';

                  // Close picker modal and show confirmation prompt modal
                  setAdjustingAppt(null);
                  setPendingTimeChange({
                    appt: target,
                    oldTime,
                    newTime,
                  });
                }}
                className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:brightness-110 transition-all shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Send</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Time Adjustment Confirmation Modal */}
      {pendingTimeChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2F3E3C]/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gradient-to-br from-[#FBF9F1] via-white to-[#E8F0F1] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#BDDBD1]/50 relative animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-4 shadow-xs">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-[#2F3E3C] mb-2">
              Confirm Appointment Reschedule
            </h3>
            
            <p className="text-sm text-[#2F3E3C]/80 leading-relaxed mb-4">
              You have changed the appointment time from{' '}
              <span className="font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                {pendingTimeChange.oldTime}
              </span>{' '}
              to{' '}
              <span className="font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                {pendingTimeChange.newTime}
              </span>
              . Are you sure you want to proceed?
            </p>

            <div className="bg-white/80 p-3.5 rounded-xl border border-[#BDDBD1]/40 mb-6 text-xs text-slate-600 space-y-1">
              <div><span className="font-semibold">Patient:</span> {pendingTimeChange.appt.name}</div>
              <div><span className="font-semibold">Treatment:</span> {pendingTimeChange.appt.treatment}</div>
              <div><span className="font-semibold">Date:</span> {pendingTimeChange.appt.date}</div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPendingTimeChange(null)}
                className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-[#2F3E3C] bg-white border border-[#BDDBD1]/60 hover:bg-[#FBF9F1] transition-all cursor-pointer shadow-xs"
              >
                No, Go Back
              </button>
              <button
                type="button"
                onClick={async () => {
                  const { appt, newTime } = pendingTimeChange;
                  setPendingTimeChange(null);
                  await updateStatus(appt.id, 'Confirmed', newTime);
                }}
                className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:brightness-110 transition-all shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Yes / Confirm</span>
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}


