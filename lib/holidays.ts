// lib/holidays.ts
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  getDocs
} from 'firebase/firestore';

export interface ClinicHoliday {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  reason: string;    // e.g. "Diwali Vacation", "Clinic Renovation"
  createdAt?: any;
}

/**
 * Checks if a specific date (YYYY-MM-DD) falls on a clinic holiday.
 * If true, returns the holiday details; otherwise null.
 */
export function checkIsDateHoliday(
  dateStr: string, 
  holidays: ClinicHoliday[]
): ClinicHoliday | null {
  if (!dateStr || !holidays || holidays.length === 0) return null;
  
  for (const h of holidays) {
    if (h.startDate && h.endDate) {
      if (dateStr >= h.startDate && dateStr <= h.endDate) {
        return h;
      }
    } else if (h.startDate && dateStr === h.startDate) {
      return h;
    }
  }
  return null;
}

/**
 * Given a holiday date (YYYY-MM-DD), find the next available business date
 * that is not in the holidays list.
 */
export function getNextAvailableWorkingDate(
  fromDateStr: string,
  holidays: ClinicHoliday[]
): string {
  if (!fromDateStr) return '';
  const parts = fromDateStr.split('-');
  if (parts.length !== 3) return '';
  
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  
  // Look ahead up to 60 days to find the next open day
  for (let i = 1; i <= 60; i++) {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + i);
    const y = nextDate.getFullYear();
    const m = String(nextDate.getMonth() + 1).padStart(2, '0');
    const d = String(nextDate.getDate()).padStart(2, '0');
    const nextDateStr = `${y}-${m}-${d}`;
    if (!checkIsDateHoliday(nextDateStr, holidays)) {
      return nextDateStr;
    }
  }
  return '';
}

/**
 * Format date nicely for human display: "24 Oct 2026"
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

/**
 * Add a new holiday to Firestore
 */
export async function addClinicHoliday(
  startDate: string,
  endDate: string,
  reason: string
): Promise<string> {
  const docRef = await addDoc(collection(db, 'holidays'), {
    startDate,
    endDate: endDate || startDate,
    reason: reason.trim() || 'Clinic Closed / Holiday',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Delete a holiday from Firestore
 */
export async function deleteClinicHoliday(id: string): Promise<void> {
  await deleteDoc(doc(db, 'holidays', id));
}

/**
 * Fetch all holidays once (for server routes or static checks)
 */
export async function fetchAllHolidays(): Promise<ClinicHoliday[]> {
  try {
    const q = query(collection(db, 'holidays'), orderBy('startDate', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({
      id: d.id,
      startDate: d.data().startDate || '',
      endDate: d.data().endDate || d.data().startDate || '',
      reason: d.data().reason || 'Holiday',
    }));
  } catch (err) {
    console.error('Failed to fetch holidays:', err);
    return [];
  }
}
