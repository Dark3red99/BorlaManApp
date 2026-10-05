import type { Address, User, UserCategory } from '../types/models';
import type { Tables } from '../types/database';
import { supabase } from './supabase';

// Auth on Supabase (email + password). The profile row is created by the
// handle_new_user trigger from the sign-up metadata; this service maps it
// to the app's User shape so screens don't change.

export class AuthError extends Error {
  constructor(
    public code:
      | 'phone-taken'
      | 'email-taken'
      | 'invalid-credentials'
      | 'email-not-confirmed'
      | 'not-found'
      | 'invalid-code'
      | 'network',
    message: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export type RegisterInput = {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  category: UserCategory;
  address: Address;
};

/** Normalizes Ghana phone numbers to +233XXXXXXXXX for comparison/storage. */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  if (digits.startsWith('+233')) return digits;
  if (digits.startsWith('233')) return `+${digits}`;
  if (digits.startsWith('0')) return `+233${digits.slice(1)}`;
  return `+233${digits}`;
}

type Profile = Tables<'profiles'>;

function toUser(p: Profile): User {
  return {
    id: p.id,
    fullName: p.full_name,
    phone: p.phone ?? '',
    email: p.email ?? '',
    // 'aboboyaa' sign-ups belong in the rider app; customers are household/corporate.
    category: p.category ?? 'household',
    address: {
      region: p.region ?? '',
      district: p.district ?? '',
      addressLine: p.address_line ?? '',
      area: p.area ?? '',
      gpsText: p.gps_text ?? undefined,
    },
    createdAt: p.created_at,
  };
}

async function loadProfile(userId: string): Promise<User> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error || !data) throw new AuthError('not-found', 'Your profile could not be loaded. Please sign in again.');
  return toUser(data);
}

function isNetworkError(message: string) {
  return /network|fetch/i.test(message);
}

export async function register(input: RegisterInput): Promise<User> {
  const email = input.email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: {
        role: 'customer',
        full_name: input.fullName.trim(),
        phone: normalizePhone(input.phone),
        category: input.category,
        region: input.address.region,
        district: input.address.district,
        address_line: input.address.addressLine,
        area: input.address.area,
        gps_text: input.address.gpsText ?? '',
      },
    },
  });

  if (error) {
    if (/already registered|already exists/i.test(error.message)) {
      throw new AuthError('email-taken', 'An account with this email already exists.');
    }
    // The profiles.phone unique constraint fails inside the sign-up trigger.
    if (/database error saving new user/i.test(error.message)) {
      throw new AuthError('phone-taken', 'An account with this phone number already exists.');
    }
    if (isNetworkError(error.message)) {
      throw new AuthError('network', 'No connection. Check your internet and try again.');
    }
    throw new AuthError('invalid-credentials', error.message);
  }
  // Supabase returns a user with no identities when the email is already taken
  // and email confirmation is on (it hides whether the account exists).
  if (data.user && data.user.identities?.length === 0) {
    throw new AuthError('email-taken', 'An account with this email already exists.');
  }
  if (!data.session || !data.user) {
    throw new AuthError(
      'email-not-confirmed',
      'Account created. Check your email to confirm it, then sign in.',
    );
  }
  return loadProfile(data.user.id);
}

/** Signs in with email + password. */
export async function signIn(email: string, password: string): Promise<User> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error || !data.user) {
    const message = error?.message ?? '';
    if (/not confirmed/i.test(message)) {
      throw new AuthError('email-not-confirmed', 'Confirm your email first. Check your inbox for the link.');
    }
    if (isNetworkError(message)) {
      throw new AuthError('network', 'No connection. Check your internet and try again.');
    }
    throw new AuthError('invalid-credentials', 'Incorrect email or password.');
  }
  return loadProfile(data.user.id);
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/** Restores the signed-in user from the persisted Supabase session, if any. */
export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return null;
  try {
    return await loadProfile(userId);
  } catch {
    return null;
  }
}

/** Calls back with null whenever the session ends (sign-out, expiry, deletion). */
export function onSignedOut(callback: () => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) callback();
  });
  return () => data.subscription.unsubscribe();
}

// ── Password reset: email code → verify → new password ─────────────
// Uses Supabase email OTP. The "Magic Link" email template must include
// {{ .Token }} so the email shows the 6-digit code.

export async function sendResetCode(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { shouldCreateUser: false },
  });
  if (error) {
    if (isNetworkError(error.message)) {
      throw new AuthError('network', 'No connection. Check your internet and try again.');
    }
    if (/signups not allowed|not found/i.test(error.message)) {
      throw new AuthError('not-found', 'No account found with this email.');
    }
    throw new AuthError('not-found', error.message);
  }
}

export async function verifyResetCode(email: string, code: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: code,
    type: 'email',
  });
  if (error) throw new AuthError('invalid-code', 'That code is wrong or has expired.');
}

/** Sets the new password on the session opened by verifyResetCode, then signs out. */
export async function setNewPassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  await supabase.auth.signOut();
  if (error) throw new AuthError('invalid-credentials', error.message);
}
