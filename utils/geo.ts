import type { GeoPoint } from '../types/models';

// Geometry helpers shared by pricing, matching, and the tracking simulation.
// The backend will do the same math in PostGIS; keeping it here means the
// mock's numbers (distance, price, ETA) match what the API will return.

const EARTH_RADIUS_KM = 6371;

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Moves `from` a straight-line step of `stepKm` toward `to`; clamps at `to`. */
export function moveToward(from: GeoPoint, to: GeoPoint, stepKm: number): GeoPoint {
  const total = haversineKm(from, to);
  if (total <= stepKm || total === 0) return to;
  const t = stepKm / total;
  return {
    latitude: from.latitude + (to.latitude - from.latitude) * t,
    longitude: from.longitude + (to.longitude - from.longitude) * t,
  };
}

/** Returns a point offset from `origin` by roughly `km` in a given direction (radians). */
export function offsetKm(origin: GeoPoint, km: number, directionRad: number): GeoPoint {
  const dLat = (km / EARTH_RADIUS_KM) * (180 / Math.PI);
  const dLon = dLat / Math.cos((origin.latitude * Math.PI) / 180);
  return {
    latitude: origin.latitude + dLat * Math.cos(directionRad),
    longitude: origin.longitude + dLon * Math.sin(directionRad),
  };
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

/** Minutes it takes an Aboboyaa to cover `km` through Accra traffic. */
export function etaMinutes(km: number, speedKmh = 18): number {
  return Math.max(1, Math.round((km / speedKmh) * 60));
}
