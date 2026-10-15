# Luminous Dental - Authentication & Data Persistence Setup Guide

This document outlines the complete setup instructions for configuring Supabase Authentication, PostgreSQL database schema with Row Level Security (RLS), and Private Storage bucket for the Luminous Dental web application.

---

## 1. Supabase Project Setup

1. Go to [https://supabase.com](https://supabase.com) and sign in or create an account.
2. Click **New Project**.
3. Choose an organization, enter a project name (e.g., `luminous-dental`), enter a strong database password, and select your preferred region.
4. Wait for the database provisioning to complete (typically 1–2 minutes).

---

## 2. Environment Variables Configuration

1. In your Supabase dashboard, navigate to **Project Settings** (gear icon) -> **API**.
2. Find:
   - **Project URL** (e.g., `https://xyzcompany.supabase.co`)
   - **anon / public key** (client-safe key protected by RLS)
3. In the root directory of this project, create a `.env.local` file (copy from `.env.example`):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
   ```
4. **Security Notice**: Never commit `.env.local` to Git. The `.gitignore` file already excludes `.env*` files while preserving `.env.example`.

---

## 3. Database Schema & RLS Migrations

1. In your Supabase Dashboard, go to the **SQL Editor** tab.
2. Click **New Query**.
3. Copy and paste the entire contents of [`supabase/migrations/20261010_init_auth_and_persistence.sql`](./supabase/migrations/20261010_init_auth_and_persistence.sql).
4. Click **Run**.
5. This migration automatically creates:
   - **`public.profiles`**: Patient profile data, roles, emergency contacts, and notification preferences.
   - **`public.treatment_plans`**: Patient care pathways/projects, status tracking, and estimates.
   - **`public.appointments`**: Patient appointment bookings with unique reference codes.
   - **`public.patient_files`**: Metadata records for dental X-Rays, scans, and documents.
   - **`public.user_activity`**: Audit trail of patient account and booking actions.
   - **Row Level Security (RLS)**: Enforces that users can only read, create, update, or delete records they own (`auth.uid() = user_id`).
   - **Automatic Triggers**: Handles `updated_at` timestamps, ensures foreign-key ownership integrity, and automatically provisions a profile row when a new user signs up in `auth.users`.
   - **Storage Bucket**: Provisions the private bucket `patient-records` with owner-only access policies.

---

## 4. Google OAuth Configuration

To enable the "Continue with Google" button:

### A. Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Configure **OAuth consent screen**:
   - User Type: **External**
   - App name: **Luminous Dental**
   - User support email & developer contact email: your email
   - Scopes: `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`
4. Go to **Credentials** -> **Create Credentials** -> **OAuth client ID**:
   - Application type: **Web application**
   - Name: **Luminous Dental Web**
   - **Authorized redirect URIs**: Copy from your Supabase Dashboard:
     - In Supabase Dashboard -> **Authentication** -> **Providers** -> **Google** -> copy the **Callback URL (for OAuth)** (format: `https://<your-project-ref>.supabase.co/auth/v1/callback`).
5. Save and copy your **Client ID** and **Client Secret**.

### B. Supabase Dashboard
1. In Supabase Dashboard, go to **Authentication** -> **Providers** -> **Google**.
2. Toggle **Enable Google provider** to ON.
3. Paste the **Client ID** and **Client Secret**.
4. Click **Save**.

---

## 5. URL Configuration & Redirect Allowlist

1. In Supabase Dashboard, navigate to **Authentication** -> **URL Configuration**.
2. Set **Site URL**:
   - For local development: `http://localhost:3000`
   - For production: `https://your-production-domain.com`
3. Under **Redirect URLs**, add the following callback URLs:
   - `http://localhost:3000/**`
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/api/auth/callback`
   - `https://your-production-domain.com/**`
   - `https://your-production-domain.com/auth/callback`

---

## 6. Email Verification & Password Reset Templates

1. In Supabase Dashboard, go to **Authentication** -> **Email Templates**.
2. **Confirm Signup Template**:
   - Ensure the link uses `{{ .ConfirmationURL }}`.
3. **Reset Password Template**:
   - Ensure the reset link points to `{{ .SiteURL }}/auth/reset-password` (configured in the code redirect).
4. By default, Supabase provides a built-in email service for testing (rate limit of 3 emails per hour). For production, connect custom SMTP (Resend, SendGrid, Amazon SES, or Postmark) in **Project Settings** -> **Authentication** -> **SMTP Settings**.

---

## 7. Storage Bucket Verification

1. In Supabase Dashboard, go to **Storage** -> **Buckets**.
2. Verify that `patient-records` exists and is marked **Private** (Public bucket = Disabled).
3. Under bucket **Policies**, verify that the 4 RLS policies (Upload, Read, Update, Delete) are active, ensuring users can only read and write inside their own folder:
   ```
   patient-records/{user_id}/*
   ```
4. File access on the frontend is granted via short-lived signed URLs (15-minute expiration) generated by `/api/files`.

---

## 8. Verifying the Implementation Locally

1. Start the development server:
   ```bash
   npm run dev
   ```
2. Visit `http://localhost:3000`:
   - Click **Sign In** in the top navigation.
   - Click **Create an account** -> register with a test email.
   - Verify that you are redirected to the verification feedback page.
   - Once verified/logged in, visit `http://localhost:3000/dashboard`:
     - Test creating a **Treatment Plan**
     - Test booking an **Appointment**
     - Test uploading a dental file (PNG, JPG, or PDF up to 10MB)
     - Test saving **Profile & Settings**
     - Test **Sign Out**
3. Verify unauthenticated route protection:
   - Try navigating directly to `http://localhost:3000/dashboard` while logged out; verify automatic redirect to `/auth/login?next=/dashboard`.

---

## 9. Security Summary

| Layer | Implementation |
|---|---|
| **Identity Verification** | Server-side verification via `supabase.auth.getUser()` on all route handlers |
| **Route Protection** | Next.js 16 Proxy (`proxy.ts`) + individual route handler authentication checks |
| **Open Redirect Defense** | Strict sanitization of `next` redirect query parameters |
| **Data Isolation** | PostgreSQL Row Level Security (RLS) on all user data tables |
| **Storage Security** | Private Supabase bucket with folder-scoped RLS policies and short-lived signed URLs |
| **Credential Hygiene** | No hardcoded secrets, publishable key used for client operations, `.env.local` git-ignored |
