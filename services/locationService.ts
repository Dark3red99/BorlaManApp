import type { CollectionPoint } from '../types/models';
import { StorageKeys, readJson, writeJson } from './storage';

// Saved collection points, one per user (future GET/PUT /me/collection-point).
// Set once via the map picker and reused on every open — never re-detected.

type CollectionPointMap = Record<string, CollectionPoint>;

export async function getCollectionPoint(userId: string): Promise<CollectionPoint | null> {
  const all = await readJson<CollectionPointMap>(StorageKeys.collectionPoints, {});
  return all[userId] ?? null;
}

export async function saveCollectionPoint(
  userId: string,
  input: Omit<CollectionPoint, 'updatedAt'>,
): Promise<CollectionPoint> {
  const saved: CollectionPoint = { ...input, updatedAt: new Date().toISOString() };
  const all = await readJson<CollectionPointMap>(StorageKeys.collectionPoints, {});
  await writeJson(StorageKeys.collectionPoints, { ...all, [userId]: saved });
  return saved;
}
