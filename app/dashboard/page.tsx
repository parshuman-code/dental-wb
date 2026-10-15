"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
  Calendar,
  Clock,
  FileText,
  Upload,
  Trash2,
  Plus,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Settings,
  History,
  Activity,
  FolderPlus,
  Edit2,
  Save,
  X,
  FileIcon,
  Download,
  Eye,
} from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'appointments' | 'plans' | 'files' | 'activity' | 'settings'>('appointments');

  // Appointments state
  const [appointments, setAppointments] = useState<any[]>([]);
  const [apptFilter, setApptFilter] = useState<'All' | 'Upcoming' | 'Past'>('All');
  const [loadingAppts, setLoadingAppts] = useState(false);

  // Treatment Plans ("Projects") state
  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [newPlanOpen, setNewPlanOpen] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanCategory, setNewPlanCategory] = useState('General Dentistry');
  const [newPlanDesc, setNewPlanDesc] = useState('');
  const [newPlanCost, setNewPlanCost] = useState('');
  const [savingPlan, setSavingPlan] = useState(false);

  // Editing plan state
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStatus, setEditStatus] = useState<string>('Active');
  const [editNotes, setEditNotes] = useState('');

  // Files state
  const [files, setFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDescription, setFileDescription] = useState('');
  const [filePlanId, setFilePlanId] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  // Activity state
  const [activity, setActivity] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // Settings state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsReminders, setSmsReminders] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Notification / Alert banner state
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Redirect if unauthenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [authLoading, user, router]);

  // Load user profile details into settings form from Firebase user
  useEffect(() => {
    if (user) {
      setFullName(user.displayName || '');
    }
  }, [user]);

  // Fetch Appointments from Firestore
  const fetchAppointments = useCallback(() => {
    if (!user) return;
    setLoadingAppts(true);
    const todayStr = new Date().toISOString().split('T')[0];

    const q = query(
      collection(db, 'appointments'),
      where('uid', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appts: any[] = [];
      snapshot.docs.forEach(d => {
        const data = d.data();
        const apptDate = data.date || '';

        // Auto-delete expired appointments from Firestore
        if (apptDate && apptDate < todayStr) {
          deleteDoc(doc(db, 'appointments', d.id)).catch(err => {
            console.warn('Dashboard auto-delete error:', err);
          });
          return;
        }

        const createdAtMillis = data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt?.seconds ? data.createdAt.seconds * 1000 : 0);
        appts.push({
          id: d.id,
          reference_code: data.referenceCode || d.id.slice(0, 8).toUpperCase(),
          treatment: data.treatment || '',
          date: apptDate,
          time: data.time || '',
          doctor: data.doctor || 'MDS Specialist',
          notes: data.notes || '',
          status: data.status || 'Pending',
          createdAtMillis,
        });
      });

      appts.sort((a, b) => {
        if (b.createdAtMillis !== a.createdAtMillis) {
          return b.createdAtMillis - a.createdAtMillis;
        }
        return (b.date || '').localeCompare(a.date || '');
      });

      setAppointments(appts as any);
      setLoadingAppts(false);
    }, () => setLoadingAppts(false));
    return unsubscribe;
  }, [user]);

  // Fetch Treatment Plans
  const fetchPlans = useCallback(async () => {
    setLoadingPlans(true);
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setPlans(data.projects || []);
      }
    } catch {
      // safe fallback
    } finally {
      setLoadingPlans(false);
    }
  }, []);

  // Fetch Files
  const fetchFiles = useCallback(async () => {
    setLoadingFiles(true);
    try {
      const res = await fetch('/api/files');
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch {
      // safe fallback
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  // Fetch Activity
  const fetchActivity = useCallback(async () => {
    setLoadingActivity(true);
    try {
      const res = await fetch('/api/activity');
      if (res.ok) {
        const data = await res.json();
        setActivity(data.activity || []);
      }
    } catch {
      // safe fallback
    } finally {
      setLoadingActivity(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      const unsub = fetchAppointments();
      fetchPlans();
      fetchFiles();
      fetchActivity();
      return () => { if (unsub) unsub(); };
    }
  }, [user, fetchAppointments, fetchPlans, fetchFiles, fetchActivity]);

  // Handle Cancel Appointment
  const handleCancelAppointment = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment request?')) return;
    try {
      await updateDoc(doc(db, 'appointments', id), { status: 'Cancelled' });
      showFeedback('success', 'Appointment marked as Cancelled');
    } catch {
      showFeedback('error', 'Failed to cancel appointment');
    }
  };

  // Handle Create Treatment Plan
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanTitle.trim()) return;

    setSavingPlan(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newPlanTitle.trim(),
          category: newPlanCategory,
          description: newPlanDesc.trim(),
          estimated_cost: newPlanCost ? parseFloat(newPlanCost) : null,
        }),
      });

      if (res.ok) {
        showFeedback('success', 'New treatment plan created');
        setNewPlanTitle('');
        setNewPlanDesc('');
        setNewPlanCost('');
        setNewPlanOpen(false);
        fetchPlans();
        fetchActivity();
      } else {
        const data = await res.json();
        showFeedback('error', data.error || 'Failed to create plan');
      }
    } catch {
      showFeedback('error', 'Network error');
    } finally {
      setSavingPlan(false);
    }
  };

  // Handle Save Plan Edit
  const handleSavePlanEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          status: editStatus,
          doctor_notes: editNotes.trim(),
        }),
      });

      if (res.ok) {
        showFeedback('success', 'Treatment plan updated');
        setEditingPlanId(null);
        fetchPlans();
        fetchActivity();
      } else {
        const data = await res.json();
        showFeedback('error', data.error || 'Failed to update plan');
      }
    } catch {
      showFeedback('error', 'Network error');
    }
  };

  // Handle Delete Plan
  const handleDeletePlan = async (id: string) => {
    if (!confirm('Delete this treatment plan? Any linked files will remain.')) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showFeedback('success', 'Treatment plan deleted');
        fetchPlans();
        fetchActivity();
      } else {
        const data = await res.json();
        showFeedback('error', data.error || 'Delete failed');
      }
    } catch {
      showFeedback('error', 'Network error');
    }
  };

  // Handle File Upload
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (fileDescription) formData.append('description', fileDescription.trim());
      if (filePlanId) formData.append('treatment_plan_id', filePlanId);

      const res = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        showFeedback('success', 'Dental record / X-Ray uploaded securely');
        setSelectedFile(null);
        setFileDescription('');
        setFilePlanId('');
        setUploadOpen(false);
        fetchFiles();
        fetchActivity();
      } else {
        const data = await res.json();
        showFeedback('error', data.error || 'Upload failed');
      }
    } catch {
      showFeedback('error', 'Network error during file upload');
    } finally {
      setUploading(false);
    }
  };

  // Handle Delete File
  const handleDeleteFile = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file? This action is permanent.')) return;
    try {
      const res = await fetch(`/api/files/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showFeedback('success', 'File deleted from secure storage');
        fetchFiles();
        fetchActivity();
      } else {
        const data = await res.json();
        showFeedback('error', data.error || 'Failed to delete file');
      }
    } catch {
      showFeedback('error', 'Network error');
    }
  };

  // Handle Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          emergency_contact: emergencyContact,
          preferences: {
            email_notifications: emailNotifs,
            sms_reminders: smsReminders,
            language: 'en',
          },
        }),
      });

      if (res.ok) {
        setSettingsSuccess(true);
        showFeedback('success', 'Profile and preferences updated successfully');
        fetchActivity();
      } else {
        const data = await res.json();
        showFeedback('error', data.error || 'Failed to update settings');
      }
    } catch {
      showFeedback('error', 'Network error');
    } finally {
      setSavingSettings(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-b from-[#FBF9F1] to-[#E8F0F1]">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#2F3E3C] mx-auto" />
          <p className="text-sm font-semibold text-[#2F3E3C]/70">Loading patient portal...</p>
        </div>
      </div>
    );
  }

  const filteredAppointments = appointments.filter((a) => {
    if (apptFilter === 'Upcoming') return a.status === 'Pending' || a.status === 'Confirmed';
    if (apptFilter === 'Past') return a.status === 'Completed' || a.status === 'Cancelled';
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FBF9F1] via-white to-[#E8F0F1]/40 py-10 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Feedback Alert Toast */}
        {feedback && (
          <div
            className={`fixed top-24 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-4 duration-300 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-red-50 text-red-900 border border-red-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span className="font-semibold">{feedback.message}</span>
          </div>
        )}

        {/* Portal Header */}
        <ScrollReveal direction="up">
          <header className="bg-gradient-to-r from-[#FBF9F1] via-white to-[#E8F0F1] border border-[#BDDBD1]/40 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2F3E3C] to-[#3d524f] text-[#BDDBD1] flex items-center justify-center font-bold text-2xl shadow-md">
                {(user.displayName || user.email || 'P').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#2F3E3C]">
                    Welcome, {user.displayName || user.email?.split('@')[0] || 'Patient'}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#BDDBD1]/50 text-[#2F3E3C] border border-[#BDDBD1]/60">
                    Verified Patient
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#2F3E3C]/70 mt-1">
                  Manage your appointments, dental treatment plans, X-rays, and patient profile
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <Link
                href="/book-appointment"
                className="flex-1 md:flex-initial py-2.5 px-5 rounded-full font-bold text-xs sm:text-sm bg-gradient-to-r from-[#2F3E3C] via-[#3d524f] to-[#2F3E3C] text-white hover:brightness-110 shadow-md transition-all text-center flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4 text-[#BDDBD1]" />
                <span>Book Appointment</span>
              </Link>
            </div>
          </header>
        </ScrollReveal>

        {/* Quick Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-white to-[#FBF9F1] p-5 rounded-2xl border border-[#BDDBD1]/30 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#2F3E3C]/60 uppercase tracking-wider">Appointments</span>
              <Calendar className="w-4 h-4 text-[#BDDBD1]" />
            </div>
            <p className="text-2xl font-black text-[#2F3E3C]">{appointments.length}</p>
            <p className="text-[11px] text-[#2F3E3C]/60 mt-1">Total bookings recorded</p>
          </div>

          <div className="bg-gradient-to-br from-white to-[#FBF9F1] p-5 rounded-2xl border border-[#BDDBD1]/30 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#2F3E3C]/60 uppercase tracking-wider">Treatment Plans</span>
              <Activity className="w-4 h-4 text-[#C7E7EC]" />
            </div>
            <p className="text-2xl font-black text-[#2F3E3C]">{plans.length}</p>
            <p className="text-[11px] text-[#2F3E3C]/60 mt-1">
              {plans.filter((p) => p.status === 'Active').length} currently active
            </p>
          </div>

          <div className="bg-gradient-to-br from-white to-[#FBF9F1] p-5 rounded-2xl border border-[#BDDBD1]/30 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#2F3E3C]/60 uppercase tracking-wider">Medical Records</span>
              <FileText className="w-4 h-4 text-[#BDDBD1]" />
            </div>
            <p className="text-2xl font-black text-[#2F3E3C]">{files.length}</p>
            <p className="text-[11px] text-[#2F3E3C]/60 mt-1">X-rays & scan files stored</p>
          </div>

          <div className="bg-gradient-to-br from-white to-[#FBF9F1] p-5 rounded-2xl border border-[#BDDBD1]/30 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#2F3E3C]/60 uppercase tracking-wider">Data Protection</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-700">Protected</p>
            <p className="text-[11px] text-[#2F3E3C]/60 mt-1">Row Level Security active</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-[#BDDBD1]/30">
          {[
            { id: 'appointments', label: 'My Appointments', icon: Calendar, count: appointments.length },
            { id: 'plans', label: 'Treatment Plans', icon: Activity, count: plans.length },
            { id: 'files', label: 'Dental Records & X-Rays', icon: FileText, count: files.length },
            { id: 'activity', label: 'Audit Activity', icon: History, count: activity.length },
            { id: 'settings', label: 'Profile & Settings', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  isCurrent
                    ? 'bg-[#2F3E3C] text-white shadow-md shadow-[#2F3E3C]/20 scale-[1.02]'
                    : 'bg-white/80 hover:bg-white text-[#2F3E3C]/70 hover:text-[#2F3E3C] border border-[#BDDBD1]/30'
                }`}
              >
                <Icon className={`w-4 h-4 ${isCurrent ? 'text-[#BDDBD1]' : 'text-[#2F3E3C]/60'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isCurrent ? 'bg-[#BDDBD1] text-[#2F3E3C]' : 'bg-[#E8F0F1] text-[#2F3E3C]/70'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: APPOINTMENTS */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex gap-2">
                {(['All', 'Upcoming', 'Past'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setApptFilter(f)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      apptFilter === f
                        ? 'bg-[#BDDBD1] text-[#2F3E3C] shadow-xs'
                        : 'bg-white/80 text-[#2F3E3C]/70 hover:text-[#2F3E3C] border border-[#BDDBD1]/30'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <Link
                href="/book-appointment"
                className="text-xs font-bold text-[#2F3E3C] hover:underline flex items-center gap-1"
              >
                Schedule New Visit <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loadingAppts ? (
              <div className="py-16 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#2F3E3C] mx-auto mb-2" />
                <p className="text-xs text-[#2F3E3C]/60">Loading appointments...</p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-16 bg-white/70 rounded-3xl border border-[#BDDBD1]/30 p-8">
                <Calendar className="w-12 h-12 text-[#BDDBD1] mx-auto mb-3" />
                <h3 className="text-base font-bold text-[#2F3E3C]">No appointments found</h3>
                <p className="text-xs text-[#2F3E3C]/60 max-w-sm mx-auto mt-1 mb-4">
                  You do not have any {apptFilter !== 'All' ? apptFilter.toLowerCase() : ''} appointments scheduled yet.
                </p>
                <Link
                  href="/book-appointment"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#2F3E3C] text-white text-xs font-bold shadow-md hover:brightness-110"
                >
                  <Plus className="w-4 h-4 text-[#BDDBD1]" /> Book Your First Appointment
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAppointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="bg-white/90 rounded-2xl p-5 border border-[#BDDBD1]/40 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <span className="text-[10px] font-mono text-[#2F3E3C]/50 uppercase tracking-wider block">
                            Ref: {appt.reference_code}
                          </span>
                          <h4 className="text-base font-bold text-[#2F3E3C]">{appt.treatment}</h4>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            appt.status === 'Confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : appt.status === 'Pending'
                              ? 'bg-amber-100 text-amber-800'
                              : appt.status === 'Completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {appt.status}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-[#2F3E3C]/75 my-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#BDDBD1]" />
                          <span>
                            {appt.date} at {appt.time}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#BDDBD1]" />
                          <span>Doctor: {appt.doctor}</span>
                        </div>
                        {appt.notes && (
                          <p className="text-[11px] text-[#2F3E3C]/60 italic mt-2 bg-[#E8F0F1]/50 p-2 rounded-lg">
                            &quot;{appt.notes}&quot;
                          </p>
                        )}
                      </div>
                    </div>

                    {appt.status === 'Pending' && (
                      <div className="pt-3 border-t border-[#BDDBD1]/20 flex justify-end">
                        <button
                          onClick={() => handleCancelAppointment(appt.id)}
                          className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancel Request
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TREATMENT PLANS ("Projects") */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#2F3E3C]">Dental Care Plans</h3>
                <p className="text-xs text-[#2F3E3C]/60">
                  Track multi-stage treatment pathways, doctor recommendations, and estimates
                </p>
              </div>
              <button
                onClick={() => setNewPlanOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2F3E3C] text-white hover:brightness-110 flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <FolderPlus className="w-4 h-4 text-[#BDDBD1]" />
                <span>New Treatment Plan</span>
              </button>
            </div>

            {/* Create New Plan Form Modal / Inline */}
            {newPlanOpen && (
              <div className="p-6 rounded-3xl bg-white border border-[#BDDBD1]/50 shadow-lg space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-[#BDDBD1]/20 pb-3">
                  <h4 className="font-bold text-sm text-[#2F3E3C]">Create New Dental Treatment Plan</h4>
                  <button onClick={() => setNewPlanOpen(false)} className="text-[#2F3E3C]/50 hover:text-[#2F3E3C]">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreatePlan} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-[#2F3E3C]/80 mb-1">Plan Title *</label>
                    <input
                      type="text"
                      required
                      value={newPlanTitle}
                      onChange={(e) => setNewPlanTitle(e.target.value)}
                      placeholder="e.g. Complete Smile Makeover & Aligners"
                      className="w-full px-3 py-2 bg-[#FBF9F1] border border-[#BDDBD1]/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BDDBD1]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#2F3E3C]/80 mb-1">Category</label>
                    <select
                      value={newPlanCategory}
                      onChange={(e) => setNewPlanCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FBF9F1] border border-[#BDDBD1]/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BDDBD1]"
                    >
                      <option value="Preventive Care">Preventive Care</option>
                      <option value="Restorative Care">Restorative Care</option>
                      <option value="Cosmetic Dentistry">Cosmetic Dentistry</option>
                      <option value="Orthodontics">Orthodontics</option>
                      <option value="Implantology">Implantology</option>
                      <option value="Oral Surgery">Oral Surgery</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-[#2F3E3C]/80 mb-1">Description / Patient Notes</label>
                    <textarea
                      rows={2}
                      value={newPlanDesc}
                      onChange={(e) => setNewPlanDesc(e.target.value)}
                      placeholder="Detailed overview of procedures or goals..."
                      className="w-full px-3 py-2 bg-[#FBF9F1] border border-[#BDDBD1]/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BDDBD1]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#2F3E3C]/80 mb-1">Estimated Cost ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newPlanCost}
                      onChange={(e) => setNewPlanCost(e.target.value)}
                      placeholder="e.g. 1200.00"
                      className="w-full px-3 py-2 bg-[#FBF9F1] border border-[#BDDBD1]/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BDDBD1]"
                    />
                  </div>

                  <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setNewPlanOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#BDDBD1]/40 text-[#2F3E3C]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingPlan}
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-[#2F3E3C] text-white hover:brightness-110 flex items-center gap-1.5"
                    >
                      {savingPlan ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      Save Treatment Plan
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loadingPlans ? (
              <div className="py-16 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#2F3E3C] mx-auto mb-2" />
                <p className="text-xs text-[#2F3E3C]/60">Loading treatment plans...</p>
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-16 bg-white/70 rounded-3xl border border-[#BDDBD1]/30 p-8">
                <Activity className="w-12 h-12 text-[#BDDBD1] mx-auto mb-3" />
                <h3 className="text-base font-bold text-[#2F3E3C]">No treatment plans recorded</h3>
                <p className="text-xs text-[#2F3E3C]/60 max-w-sm mx-auto mt-1 mb-4">
                  Create a treatment pathway to organize procedures, milestones, and medical files.
                </p>
                <button
                  onClick={() => setNewPlanOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#2F3E3C] text-white text-xs font-bold shadow-md hover:brightness-110 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#BDDBD1]" /> Create First Plan
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plans.map((plan) => {
                  const isEditing = editingPlanId === plan.id;
                  return (
                    <div
                      key={plan.id}
                      className="bg-white/90 rounded-2xl p-5 border border-[#BDDBD1]/40 shadow-xs flex flex-col justify-between"
                    >
                      {isEditing ? (
                        <div className="space-y-3 text-xs">
                          <div>
                            <label className="block font-bold text-[#2F3E3C]/80 mb-1">Title</label>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full px-3 py-1.5 bg-[#FBF9F1] border border-[#BDDBD1]/50 rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-[#2F3E3C]/80 mb-1">Status</label>
                            <select
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value as any)}
                              className="w-full px-3 py-1.5 bg-[#FBF9F1] border border-[#BDDBD1]/50 rounded-lg"
                            >
                              <option value="Active">Active</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                              <option value="On Hold">On Hold</option>
                              <option value="Archived">Archived</option>
                            </select>
                          </div>
                          <div>
                            <label className="block font-bold text-[#2F3E3C]/80 mb-1">Doctor Notes</label>
                            <textarea
                              rows={2}
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              className="w-full px-3 py-1.5 bg-[#FBF9F1] border border-[#BDDBD1]/50 rounded-lg"
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <button
                              onClick={() => setEditingPlanId(null)}
                              className="px-3 py-1.5 rounded-lg border border-[#BDDBD1]/40 text-[#2F3E3C]"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSavePlanEdit(plan.id)}
                              className="px-4 py-1.5 rounded-lg bg-[#2F3E3C] text-white flex items-center gap-1 font-bold"
                            >
                              <Save className="w-3.5 h-3.5 text-[#BDDBD1]" /> Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div>
                                <span className="text-[10px] font-bold text-[#BDDBD1] uppercase tracking-wider block">
                                  {plan.category}
                                </span>
                                <h4 className="text-base font-bold text-[#2F3E3C]">{plan.title}</h4>
                              </div>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  plan.status === 'Completed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : plan.status === 'In Progress'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-[#BDDBD1]/50 text-[#2F3E3C]'
                                }`}
                              >
                                {plan.status}
                              </span>
                            </div>

                            {plan.description && (
                              <p className="text-xs text-[#2F3E3C]/75 mb-3 leading-relaxed">
                                {plan.description}
                              </p>
                            )}

                            {plan.doctor_notes && (
                              <div className="p-2.5 rounded-xl bg-[#E8F0F1]/60 border border-[#BDDBD1]/30 text-xs text-[#2F3E3C] mb-3">
                                <span className="font-bold text-[10px] uppercase text-[#2F3E3C]/60 block mb-0.5">
                                  Doctor Notes
                                </span>
                                {plan.doctor_notes}
                              </div>
                            )}

                            {plan.estimated_cost && (
                              <p className="text-xs font-semibold text-[#2F3E3C]/80">
                                Estimated Cost: <span className="font-bold text-[#2F3E3C]">${plan.estimated_cost}</span>
                              </p>
                            )}
                          </div>

                          <div className="pt-3 mt-3 border-t border-[#BDDBD1]/20 flex items-center justify-between text-xs">
                            <span className="text-[10px] text-[#2F3E3C]/50">
                              Created {new Date(plan.created_at).toLocaleDateString()}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingPlanId(plan.id);
                                  setEditTitle(plan.title);
                                  setEditStatus(plan.status);
                                  setEditNotes(plan.doctor_notes || '');
                                }}
                                className="text-xs font-semibold text-[#2F3E3C] hover:text-[#2F3E3C]/70 flex items-center gap-1 cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button
                                onClick={() => handleDeletePlan(plan.id)}
                                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DENTAL RECORDS & X-RAYS (Supabase Storage) */}
        {activeTab === 'files' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#2F3E3C]">Patient Medical Records & Scans</h3>
                <p className="text-xs text-[#2F3E3C]/60">
                  Secure, private encrypted storage for digital X-Rays, intraoral photos, and reports
                </p>
              </div>
              <button
                onClick={() => setUploadOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2F3E3C] text-white hover:brightness-110 flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[#BDDBD1]" />
                <span>Upload Medical File</span>
              </button>
            </div>

            {/* File Upload Modal / Form */}
            {uploadOpen && (
              <div className="p-6 rounded-3xl bg-white border border-[#BDDBD1]/50 shadow-lg space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-[#BDDBD1]/20 pb-3">
                  <h4 className="font-bold text-sm text-[#2F3E3C]">Upload New Dental Record</h4>
                  <button onClick={() => setUploadOpen(false)} className="text-[#2F3E3C]/50 hover:text-[#2F3E3C]">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleFileUpload} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-[#2F3E3C]/80 mb-1">
                      Choose File (PNG, JPEG, WebP, PDF up to 10MB) *
                    </label>
                    <input
                      type="file"
                      required
                      accept=".png,.jpg,.jpeg,.webp,.pdf"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 bg-[#FBF9F1] border border-[#BDDBD1]/50 rounded-xl"
                    />
                    {selectedFile && (
                      <p className="text-[11px] text-[#2F3E3C]/70 mt-1">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-[#2F3E3C]/80 mb-1">
                      Link to Treatment Plan (Optional)
                    </label>
                    <select
                      value={filePlanId}
                      onChange={(e) => setFilePlanId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FBF9F1] border border-[#BDDBD1]/50 rounded-xl"
                    >
                      <option value="">None / Standalone record</option>
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({p.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#2F3E3C]/80 mb-1">Notes / Description</label>
                    <input
                      type="text"
                      value={fileDescription}
                      onChange={(e) => setFileDescription(e.target.value)}
                      placeholder="e.g. Upper right quadrant bite-wing X-Ray"
                      className="w-full px-3 py-2 bg-[#FBF9F1] border border-[#BDDBD1]/50 rounded-xl"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setUploadOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#BDDBD1]/40 text-[#2F3E3C]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploading || !selectedFile}
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-[#2F3E3C] text-white hover:brightness-110 flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>{uploading ? 'Uploading to Secure Bucket...' : 'Upload File'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loadingFiles ? (
              <div className="py-16 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#2F3E3C] mx-auto mb-2" />
                <p className="text-xs text-[#2F3E3C]/60">Loading medical records...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-16 bg-white/70 rounded-3xl border border-[#BDDBD1]/30 p-8">
                <FileText className="w-12 h-12 text-[#BDDBD1] mx-auto mb-3" />
                <h3 className="text-base font-bold text-[#2F3E3C]">No medical records uploaded</h3>
                <p className="text-xs text-[#2F3E3C]/60 max-w-sm mx-auto mt-1 mb-4">
                  Upload your dental X-rays, treatment reports, or prescriptions to keep them synced safely across devices.
                </p>
                <button
                  onClick={() => setUploadOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#2F3E3C] text-white text-xs font-bold shadow-md hover:brightness-110 cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-[#BDDBD1]" /> Upload First Record
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file) => {
                  const isImage = file.file_type.startsWith('image/');
                  return (
                    <div
                      key={file.id}
                      className="bg-white/95 rounded-2xl p-4 border border-[#BDDBD1]/40 shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        {/* Thumbnail / File icon */}
                        <div className="h-32 w-full rounded-xl bg-slate-900/5 mb-3 flex items-center justify-center overflow-hidden border border-[#BDDBD1]/20">
                          {isImage && file.signed_url ? (
                            <img
                              src={file.signed_url}
                              alt={file.file_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center p-3">
                              <FileIcon className="w-10 h-10 text-[#2F3E3C]/60 mx-auto mb-1" />
                              <span className="text-[10px] font-mono text-[#2F3E3C]/60 uppercase">
                                {file.file_type.split('/')[1] || 'PDF'}
                              </span>
                            </div>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-[#2F3E3C] truncate" title={file.file_name}>
                          {file.file_name}
                        </h4>

                        {file.description && (
                          <p className="text-[11px] text-[#2F3E3C]/70 mt-1 line-clamp-2">
                            {file.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-[#2F3E3C]/50 mt-2">
                          <span>{(file.file_size / 1024 / 1024).toFixed(2)} MB</span>
                          <span>{new Date(file.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-[#BDDBD1]/20 flex items-center justify-between">
                        {file.signed_url ? (
                          <a
                            href={file.signed_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-[#2F3E3C] hover:underline flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#BDDBD1]" /> View / Download
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400">URL expired</span>
                        )}

                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: AUDIT ACTIVITY LOG */}
        {activeTab === 'activity' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-[#2F3E3C]">Account Activity & Audit Trail</h3>
              <p className="text-xs text-[#2F3E3C]/60">
                Transparent chronological record of your clinic visits, logins, and file operations
              </p>
            </div>

            {loadingActivity ? (
              <div className="py-16 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#2F3E3C] mx-auto mb-2" />
                <p className="text-xs text-[#2F3E3C]/60">Loading activity...</p>
              </div>
            ) : activity.length === 0 ? (
              <div className="text-center py-12 bg-white/70 rounded-3xl border border-[#BDDBD1]/30">
                <p className="text-xs text-[#2F3E3C]/60">No recent activity logged yet.</p>
              </div>
            ) : (
              <div className="bg-white/90 rounded-3xl p-6 border border-[#BDDBD1]/30 shadow-xs divide-y divide-[#BDDBD1]/20">
                {activity.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-[#E8F0F1] text-[#2F3E3C]">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-[#2F3E3C]">
                          {item.action.replace(/[._]/g, ' ').toUpperCase()}
                        </p>
                        <p className="text-[11px] text-[#2F3E3C]/60">
                          Entity: {item.entity_type} {item.entity_id ? `(#${item.entity_id.slice(0, 8)})` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#2F3E3C]/50">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PROFILE & SETTINGS */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl bg-white/90 rounded-3xl p-6 sm:p-8 border border-[#BDDBD1]/40 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-bold text-[#2F3E3C]">Patient Profile & Preferences</h3>
              <p className="text-xs text-[#2F3E3C]/60">
                Update your contact details, emergency phone, and appointment communication settings
              </p>
            </div>

            {settingsSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Your profile settings have been saved and synced!</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#2F3E3C]/80 mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user.email || ''}
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-400 mt-1">Managed via Supabase Auth</p>
              </div>

              <div>
                <label className="block font-bold text-[#2F3E3C]/80 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3.5 py-2.5 bg-[#FBF9F1] border border-[#BDDBD1]/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BDDBD1]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2F3E3C]/80 mb-1">Contact Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 012-3456"
                  className="w-full px-3.5 py-2.5 bg-[#FBF9F1] border border-[#BDDBD1]/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BDDBD1]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2F3E3C]/80 mb-1">Emergency Contact Information</label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="e.g. Jane Doe (Spouse) - +1 555-987-6543"
                  className="w-full px-3.5 py-2.5 bg-[#FBF9F1] border border-[#BDDBD1]/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BDDBD1]"
                />
              </div>

              <div className="pt-4 border-t border-[#BDDBD1]/20 space-y-3">
                <h4 className="font-bold text-sm text-[#2F3E3C]">Notification Preferences</h4>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotifs}
                    onChange={(e) => setEmailNotifs(e.target.checked)}
                    className="w-4 h-4 rounded text-[#2F3E3C] focus:ring-[#BDDBD1]"
                  />
                  <div>
                    <span className="font-bold text-[#2F3E3C] block">Email Confirmations & Reminders</span>
                    <span className="text-[11px] text-[#2F3E3C]/60">Receive email alerts when appointment status updates</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smsReminders}
                    onChange={(e) => setSmsReminders(e.target.checked)}
                    className="w-4 h-4 rounded text-[#2F3E3C] focus:ring-[#BDDBD1]"
                  />
                  <div>
                    <span className="font-bold text-[#2F3E3C] block">WhatsApp / SMS Reminders</span>
                    <span className="text-[11px] text-[#2F3E3C]/60">Send appointment reminders to contact phone number</span>
                  </div>
                </label>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs bg-[#2F3E3C] text-white hover:brightness-110 flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {savingSettings ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-[#BDDBD1]" />}
                  <span>Save Preferences</span>
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
