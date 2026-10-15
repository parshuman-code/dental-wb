export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }
  const trimmed = email.trim();
  if (trimmed.length > 254) {
    return { valid: false, error: 'Email exceeds maximum allowable length' };
  }
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }
  return { valid: true };
}

export function validatePassword(password: string): ValidationResult {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }
  if (password.length > 128) {
    return { valid: false, error: 'Password exceeds maximum allowable length' };
  }
  const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  if (!hasNumberOrSymbol) {
    return { valid: false, error: 'Password must contain at least one number or special character' };
  }
  return { valid: true };
}

export function validateName(name: string): ValidationResult {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name is required' };
  }
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }
  if (trimmed.length > 100) {
    return { valid: false, error: 'Name cannot exceed 100 characters' };
  }
  return { valid: true };
}

export function validatePhone(phone: string): ValidationResult {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Phone number is required' };
  }
  const cleaned = phone.replace(/[\s\-()]/g, '');
  if (!/^\+?[0-9]{7,15}$/.test(cleaned)) {
    return { valid: false, error: 'Please enter a valid phone number (7 to 15 digits)' };
  }
  return { valid: true };
}

export const ALLOWED_FILE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export function validateFile(file: { name: string; size: number; type: string }): ValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: 'File size exceeds the 10MB limit' };
  }
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Unsupported file type. Only PNG, JPEG, WebP, and PDF are allowed' };
  }
  return { valid: true };
}

/**
 * Validates a redirect URL path to prevent open redirect vulnerabilities.
 * Only allows relative paths on the same origin.
 */
export function sanitizeRedirectPath(path: string | null | undefined, fallback = '/dashboard'): string {
  if (!path) return fallback;

  // Reject paths that start with protocol, double slash, or contain backslashes
  if (
    path.startsWith('//') ||
    path.startsWith('\\') ||
    path.includes('://') ||
    path.startsWith('javascript:') ||
    path.startsWith('data:')
  ) {
    return fallback;
  }

  // Must begin with a single slash
  if (!path.startsWith('/')) {
    return fallback;
  }

  return path;
}
