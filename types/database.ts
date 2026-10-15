export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface UserPreferences {
  email_notifications: boolean;
  sms_reminders: boolean;
  language: string;
  theme?: 'light' | 'dark' | 'system';
  [key: string]: any;
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: 'patient' | 'doctor' | 'admin';
  emergency_contact: string | null;
  preferences: UserPreferences;
  created_at: string;
  updated_at: string;
}

export interface TreatmentPlan {
  id: string;
  user_id: string;
  title: string;
  category: string;
  description: string | null;
  doctor_notes: string | null;
  status: 'Active' | 'In Progress' | 'Completed' | 'On Hold' | 'Archived';
  estimated_cost: number | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  treatment_plan_id: string | null;
  treatment: string;
  date: string;
  time: string;
  doctor: string;
  patient_name: string;
  patient_phone: string;
  notes: string | null;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  reference_code: string;
  created_at: string;
  updated_at: string;
}

export interface PatientFile {
  id: string;
  user_id: string;
  treatment_plan_id: string | null;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  bucket_id: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  // Transient signed URL for rendering/downloading
  signed_url?: string;
}

export interface UserActivity {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, any>;
  ip_address: string | null;
  created_at: string;
}
