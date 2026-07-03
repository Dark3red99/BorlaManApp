import type { Address, User, UserCategory } from '../types/models';
import { StorageKeys, readJson, writeJson, writeManyJson, readManyJson, remove } from './storage';

// Mock auth service. The function signatures are the contract the real
// backend will implement (POST /auth/register, POST /auth/login, ...);
// only the bodies change when the API exists.
//
// MOCK ONLY: accounts live on-device in AsyncStorage and passwords are
// stored as-is. This must be replaced by the backend before any release.

type StoredUser = User & { password: string };

export class AuthError extends Error {
  constructor(
    public code:
      | 'phone-taken'
      | 'email-taken'
      | 'invalid-credentials'
      | 'not-found',
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

function toPublicUser({ password: _password, ...user }: StoredUser): User {
  return user;
}

async function getStoredUsers(): Promise<StoredUser[]> {
  return readJson<StoredUser[]>(StorageKeys.users, []);
}

export async function register(input: RegisterInput): Promise<User> {
  const users = await getStoredUsers();
  const phone = normalizePhone(input.phone);
  const email = input.email.trim().toLowerCase();

  if (users.some((u) => u.phone === phone)) {
    throw new AuthError('phone-taken', 'An account with this phone number already exists.');
  }
  if (users.some((u) => u.email === email)) {
    throw new AuthError('email-taken', 'An account with this email already exists.');
  }

  const user: StoredUser = {
    id: `u_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    fullName: input.fullName.trim(),
    phone,
    email,
    category: input.category,
    address: input.address,
    createdAt: new Date().toISOString(),
    password: input.password,
  };

  await writeManyJson([
    [StorageKeys.users, [...users, user]],
    [StorageKeys.session, user.id],
  ]);
  return toPublicUser(user);
}

/** Signs in with email or phone number plus password. */
export async function signIn(identifier: string, password: string): Promise<User> {
  const users = await getStoredUsers();
  const id = identifier.trim();
  const byEmail = id.toLowerCase();
  const byPhone = normalizePhone(id);

  const user = users.find((u) => u.email === byEmail || u.phone === byPhone);
  if (!user || user.password !== password) {
    throw new AuthError('invalid-credentials', 'Incorrect email/phone or password.');
  }

  await writeJson(StorageKeys.session, user.id);
  return toPublicUser(user);
}

export async function signOut(): Promise<void> {
  await remove(StorageKeys.session);
}

/** Restores the signed-in user from the persisted session, if any. */
export async function getCurrentUser(): Promise<User | null> {
  const { [StorageKeys.session]: sessionId, [StorageKeys.users]: users } = await readManyJson({
    [StorageKeys.session]: null as string | null,
    [StorageKeys.users]: [] as StoredUser[],
  });
  if (!sessionId) return null;
  const user = users.find((u) => u.id === sessionId);
  return user ? toPublicUser(user) : null;
}

export async function resetPassword(phone: string, newPassword: string): Promise<void> {
  const users = await getStoredUsers();
  const normalized = normalizePhone(phone);
  const idx = users.findIndex((u) => u.phone === normalized);
  if (idx === -1) {
    throw new AuthError('not-found', 'No account found with this phone number.');
  }
  users[idx] = { ...users[idx], password: newPassword };
  await writeJson(StorageKeys.users, users);
}
