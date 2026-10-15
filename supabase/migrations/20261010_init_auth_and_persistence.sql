-- =========================================================================
-- LUMINOUS DENTAL: COMPLETE AUTHENTICATION & USER DATA PERSISTENCE SCHEMA
-- Migration: 20261010_init_auth_and_persistence.sql
-- =========================================================================

-- Enable uuid-ossp or pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------
-- 1. PROFILES TABLE (Patient & User Profiles)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'admin')),
  emergency_contact TEXT,
  preferences JSONB NOT NULL DEFAULT '{"email_notifications": true, "sms_reminders": true, "language": "en"}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON public.profiles
  FOR DELETE
  USING (auth.uid() = id);

-- -------------------------------------------------------------------------
-- 2. TREATMENT PLANS ("Projects / Care Pathways")
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.treatment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General Dentistry',
  description TEXT,
  doctor_notes TEXT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'In Progress', 'Completed', 'On Hold', 'Archived')),
  estimated_cost NUMERIC(10, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_treatment_plans_user_id ON public.treatment_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_status ON public.treatment_plans(status);

-- Enable RLS
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;

-- Treatment Plans Policies
CREATE POLICY "Users can view own treatment plans"
  ON public.treatment_plans
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own treatment plans"
  ON public.treatment_plans
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own treatment plans"
  ON public.treatment_plans
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own treatment plans"
  ON public.treatment_plans
  FOR DELETE
  USING (auth.uid() = user_id);

-- -------------------------------------------------------------------------
-- 3. APPOINTMENTS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  treatment_plan_id UUID REFERENCES public.treatment_plans(id) ON DELETE SET NULL,
  treatment TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  doctor TEXT DEFAULT 'MDS Specialist',
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Completed', 'Cancelled')),
  reference_code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_treatment_plan ON public.appointments(treatment_plan_id);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Appointments Policies
CREATE POLICY "Users can view own appointments"
  ON public.appointments
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own appointments"
  ON public.appointments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own appointments"
  ON public.appointments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own appointments"
  ON public.appointments
  FOR DELETE
  USING (auth.uid() = user_id);

-- -------------------------------------------------------------------------
-- 4. PATIENT FILES TABLE (X-Rays, Scans, Reports, Prescriptions)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.patient_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  treatment_plan_id UUID REFERENCES public.treatment_plans(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  bucket_id TEXT NOT NULL DEFAULT 'patient-records',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_patient_files_user_id ON public.patient_files(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_files_treatment_plan ON public.patient_files(treatment_plan_id);

-- Enable RLS
ALTER TABLE public.patient_files ENABLE ROW LEVEL SECURITY;

-- Patient Files Policies
CREATE POLICY "Users can view own files"
  ON public.patient_files
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own file records"
  ON public.patient_files
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own file records"
  ON public.patient_files
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own file records"
  ON public.patient_files
  FOR DELETE
  USING (auth.uid() = user_id);

-- Constraint check: If treatment_plan_id is supplied, it MUST belong to the user
CREATE OR REPLACE FUNCTION public.check_treatment_plan_ownership()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.treatment_plan_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.treatment_plans
      WHERE id = NEW.treatment_plan_id AND user_id = NEW.user_id
    ) THEN
      RAISE EXCEPTION 'Cannot associate record with a treatment plan owned by another user';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_file_plan_owner ON public.patient_files;
CREATE TRIGGER trg_check_file_plan_owner
  BEFORE INSERT OR UPDATE ON public.patient_files
  FOR EACH ROW
  EXECUTE FUNCTION public.check_treatment_plan_ownership();

DROP TRIGGER IF EXISTS trg_check_appt_plan_owner ON public.appointments;
CREATE TRIGGER trg_check_appt_plan_owner
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.check_treatment_plan_ownership();

-- -------------------------------------------------------------------------
-- 5. USER ACTIVITY AUDIT TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_activity_user_created ON public.user_activity(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- User Activity Policies
CREATE POLICY "Users can view own activity log"
  ON public.user_activity
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity records"
  ON public.user_activity
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- -------------------------------------------------------------------------
-- 6. AUTOMATIC UPDATED_AT TRIGGER FUNCTION
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_treatment_plans_updated_at ON public.treatment_plans;
CREATE TRIGGER trg_treatment_plans_updated_at
  BEFORE UPDATE ON public.treatment_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_appointments_updated_at ON public.appointments;
CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_patient_files_updated_at ON public.patient_files;
CREATE TRIGGER trg_patient_files_updated_at
  BEFORE UPDATE ON public.patient_files
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- -------------------------------------------------------------------------
-- 7. NEW USER REGISTRATION TRIGGER (auth.users -> public.profiles)
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- -------------------------------------------------------------------------
-- 8. SUPABASE STORAGE BUCKET & RLS POLICIES
-- -------------------------------------------------------------------------
-- Insert patient-records private bucket if storage.buckets exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'patient-records',
      'patient-records',
      false, -- PRIVATE BUCKET
      10485760, -- 10MB limit
      ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
    )
    ON CONFLICT (id) DO UPDATE SET
      public = false,
      file_size_limit = 10485760;
  END IF;
END $$;

-- Storage RLS Policies: only owner can upload, view, or delete inside their {user_id}/* folder
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

    -- Drop existing if re-running
    DROP POLICY IF EXISTS "Authenticated users can upload own files" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can read own files" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can update own files" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can delete own files" ON storage.objects;

    CREATE POLICY "Authenticated users can upload own files"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'patient-records' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );

    CREATE POLICY "Authenticated users can read own files"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'patient-records' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );

    CREATE POLICY "Authenticated users can update own files"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'patient-records' AND
        (storage.foldername(name))[1] = auth.uid()::text
      )
      WITH CHECK (
        bucket_id = 'patient-records' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );

    CREATE POLICY "Authenticated users can delete own files"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'patient-records' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;
