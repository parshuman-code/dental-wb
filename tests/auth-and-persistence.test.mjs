import assert from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

console.log('🧪 Starting Luminous Dental Auth & Persistence Verification Test Suite...\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     ${err.message}`);
  }
}

// ============================================================================
// 1. INPUT VALIDATION TESTS
// ============================================================================
console.log('--- 1. Validation Logic Tests ---');

import { validateEmail, validatePassword, validateName, validatePhone, validateFile } from '../lib/validation.ts';

test('Valid emails pass validation', () => {
  assert.strictEqual(validateEmail('patient@example.com').valid, true);
  assert.strictEqual(validateEmail('doctor.smith@clinic.co.uk').valid, true);
});

test('Invalid emails fail validation with clear error', () => {
  assert.strictEqual(validateEmail('not-an-email').valid, false);
  assert.strictEqual(validateEmail('').valid, false);
  assert.strictEqual(validateEmail('missing@domain').valid, false);
});

test('Strong passwords pass validation', () => {
  assert.strictEqual(validatePassword('Dental2026!').valid, true);
  assert.strictEqual(validatePassword('P@ssword123').valid, true);
});

test('Weak passwords fail validation', () => {
  assert.strictEqual(validatePassword('short1!').valid, false); // < 8 chars
  assert.strictEqual(validatePassword('passwordonly').valid, false); // no number or symbol
});

test('Phone number validation', () => {
  assert.strictEqual(validatePhone('+15551234567').valid, true);
  assert.strictEqual(validatePhone('9876543210').valid, true);
  assert.strictEqual(validatePhone('123').valid, false);
});

test('File size and MIME type validation', () => {
  assert.strictEqual(validateFile({ name: 'xray.png', size: 1024 * 1024, type: 'image/png' }).valid, true);
  assert.strictEqual(validateFile({ name: 'report.pdf', size: 2 * 1024 * 1024, type: 'application/pdf' }).valid, true);
  // Rejects files > 10MB
  assert.strictEqual(validateFile({ name: 'huge.png', size: 15 * 1024 * 1024, type: 'image/png' }).valid, false);
  // Rejects unauthorized executable types
  assert.strictEqual(validateFile({ name: 'malware.exe', size: 1024, type: 'application/x-msdownload' }).valid, false);
});

// ============================================================================
// 2. OPEN REDIRECT DEFENSE TESTS
// ============================================================================
console.log('\n--- 2. Open Redirect Defense Tests ---');

import { sanitizeRedirectPath } from '../lib/validation.ts';

test('Safe internal relative redirects are allowed', () => {
  assert.strictEqual(sanitizeRedirectPath('/dashboard'), '/dashboard');
  assert.strictEqual(sanitizeRedirectPath('/booking-history'), '/booking-history');
  assert.strictEqual(sanitizeRedirectPath('/services?tab=implants'), '/services?tab=implants');
});

test('Malicious external redirect attempts are neutralized', () => {
  assert.strictEqual(sanitizeRedirectPath('https://attacker.com/steal-session'), '/dashboard');
  assert.strictEqual(sanitizeRedirectPath('//attacker.com'), '/dashboard');
  assert.strictEqual(sanitizeRedirectPath('\\\\attacker.com'), '/dashboard');
  assert.strictEqual(sanitizeRedirectPath('javascript:alert(1)'), '/dashboard');
  assert.strictEqual(sanitizeRedirectPath(null), '/dashboard');
});

// ============================================================================
// 3. DATABASE SCHEMA & RLS INTEGRITY TESTS
// ============================================================================
console.log('\n--- 3. Database Schema & RLS Policy Integrity ---');

test('Migration SQL file exists and contains all required tables and RLS', () => {
  const sqlPath = join(process.cwd(), 'supabase', 'migrations', '20261010_init_auth_and_persistence.sql');
  assert.strictEqual(existsSync(sqlPath), true, 'Migration SQL file must exist');

  const sql = readFileSync(sqlPath, 'utf8');

  // Verify all 5 core tables exist
  assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public.profiles'), 'Must contain profiles table');
  assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public.treatment_plans'), 'Must contain treatment_plans table');
  assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public.appointments'), 'Must contain appointments table');
  assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public.patient_files'), 'Must contain patient_files table');
  assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public.user_activity'), 'Must contain user_activity table');

  // Verify RLS is enabled on all tables
  assert.ok(sql.includes('ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;'), 'Profiles must have RLS');
  assert.ok(sql.includes('ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;'), 'Treatment plans must have RLS');
  assert.ok(sql.includes('ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;'), 'Appointments must have RLS');
  assert.ok(sql.includes('ALTER TABLE public.patient_files ENABLE ROW LEVEL SECURITY;'), 'Patient files must have RLS');
  assert.ok(sql.includes('ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;'), 'User activity must have RLS');

  // Verify ownership checks using auth.uid()
  assert.ok(sql.includes('auth.uid() = id'), 'Profiles must check auth.uid() = id');
  assert.ok(sql.includes('auth.uid() = user_id'), 'User data must check auth.uid() = user_id');

  // Verify storage policies
  assert.ok(sql.includes('patient-records'), 'Storage bucket patient-records must be configured');
  assert.ok(sql.includes('(storage.foldername(name))[1] = auth.uid()::text'), 'Storage RLS must isolate files by auth.uid()');
});

// ============================================================================
// 4. NEXT.JS 16 CONVENTIONS & FILE CHECK
// ============================================================================
console.log('\n--- 4. Next.js 16 Proxy & Route Verification ---');

test('proxy.ts exists in root directory', () => {
  assert.strictEqual(existsSync(join(process.cwd(), 'proxy.ts')), true);
});

test('.env.example exists and contains Supabase placeholders', () => {
  const envExample = readFileSync(join(process.cwd(), '.env.example'), 'utf8');
  assert.ok(envExample.includes('NEXT_PUBLIC_SUPABASE_URL'), 'Must contain NEXT_PUBLIC_SUPABASE_URL');
  assert.ok(envExample.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY'), 'Must contain NEXT_PUBLIC_SUPABASE_ANON_KEY');
});

test('AUTH_SETUP.md exists and is documented', () => {
  assert.strictEqual(existsSync(join(process.cwd(), 'AUTH_SETUP.md')), true);
});

// Summary
console.log('\n======================================================');
console.log(`Results: ${passedTests} / ${totalTests} tests passed (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log('======================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
