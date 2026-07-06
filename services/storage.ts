import AsyncStorage from '@react-native-async-storage/async-storage';

// Typed JSON helpers over AsyncStorage. All persisted app data goes through
// here so swapping to a real backend (or SecureStore for sensitive values)
// happens in one place.

export const StorageKeys = {
  users: '@borlaman/users',
  session: '@borlaman/session', // id of the signed-in user
  requests: '@borlaman/requests',
  collectors: '@borlaman/collectors', // mock fleet, seeded around the first pickup point
  payments: '@borlaman/payments',
  ratings: '@borlaman/ratings',
  recurring: '@borlaman/recurring', // standing weekly pickup plans
  quizResults: '@borlaman/quizResults', // Learn & Earn quiz standings
} as const;

export async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

/** Writes several keys in one native round-trip. */
export async function writeManyJson(entries: [string, unknown][]): Promise<void> {
  await AsyncStorage.multiSet(entries.map(([k, v]) => [k, JSON.stringify(v)] as [string, string]));
}

/** Reads several keys in one native round-trip; missing keys get the fallback. */
export async function readManyJson<T extends Record<string, unknown>>(fallbacks: T): Promise<T> {
  const keys = Object.keys(fallbacks);
  const result = { ...fallbacks };
  try {
    const pairs = await AsyncStorage.multiGet(keys);
    for (const [key, raw] of pairs) {
      if (raw != null) (result as Record<string, unknown>)[key] = JSON.parse(raw);
    }
  } catch {
    // fall through with fallbacks
  }
  return result;
}

export async function remove(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}
