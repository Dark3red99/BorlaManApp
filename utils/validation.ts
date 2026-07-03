// Shared form validation. Each validator returns an error message or null.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Ghana mobile: 0XXXXXXXXX, or with +233/233 prefix.
const GH_PHONE_RE = /^(?:\+?233|0)\d{9}$/;

export function validateFullName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Enter your full name.';
  if (trimmed.length < 3) return 'Name looks too short.';
  return null;
}

export function validatePhone(phone: string): string | null {
  const compact = phone.replace(/[\s-]/g, '');
  if (!compact) return 'Enter your phone number.';
  if (!GH_PHONE_RE.test(compact)) return 'Enter a valid Ghana phone number, e.g. 024 123 4567.';
  return null;
}

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return 'Enter your email address.';
  if (!EMAIL_RE.test(trimmed)) return 'Enter a valid email address.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Enter a password.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  return null;
}

export function validateConfirmPassword(password: string, confirm: string): string | null {
  if (!confirm) return 'Confirm your password.';
  if (password !== confirm) return 'Passwords do not match.';
  return null;
}

export function validateRequired(value: string, label: string): string | null {
  return value.trim() ? null : `Enter your ${label}.`;
}
