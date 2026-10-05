import type { CollectionPoint } from '@borlaman/shared/types/models';
import type { Tables } from '@borlaman/shared/types/database';
import { supabase } from './supabase';

// Saved collection point, one per user (collection_points table).
// Set once via the map picker and reused on every open — never re-detected.

type Source = CollectionPoint['source'];
const toDbSource = (s: Source) => (s === 'digital-address' ? 'digital_address' : s);
const fromDbSource = (s: Tables<'collection_points'>['source']): Source =>
  s === 'digital_address' ? 'digital-address' : s;

function toCollectionPoint(row: Tables<'collection_points'>): CollectionPoint {
  return {
    point: { latitude: row.lat ?? 0, longitude: row.lng ?? 0 },
    label: row.label,
    gpsText: row.gps_text ?? undefined,
    source: fromDbSource(row.source),
    updatedAt: row.updated_at,
  };
}

// userId is implied by the session (RLS); kept in the signature for callers.
export async function getCollectionPoint(_userId: string): Promise<CollectionPoint | null> {
  const { data, error } = await supabase.from('collection_points').select('*').maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toCollectionPoint(data) : null;
}

export async function saveCollectionPoint(
  _userId: string,
  input: Omit<CollectionPoint, 'updatedAt'>,
): Promise<CollectionPoint> {
  const { data, error } = await supabase.rpc('set_collection_point', {
    p_lat: input.point.latitude,
    p_lng: input.point.longitude,
    p_label: input.label,
    p_gps_text: input.gpsText ?? null,
    p_source: toDbSource(input.source),
  });
  if (error || !data) throw new Error(error?.message ?? 'Could not save your collection point.');
  return toCollectionPoint(data);
}
