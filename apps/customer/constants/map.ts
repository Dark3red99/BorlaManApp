import type { GeoPoint } from '@borlaman/shared/types/models';

// Maps are react-native-maps (Apple Maps on iPhone, Google Maps on Android),
// which runs in Expo Go. MapTiler is only used for address search; its key
// is inlined into the bundle at build time (EXPO_PUBLIC_*), so restrict it
// by app ID in the MapTiler dashboard.

export const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY ?? '';

/** False while the .env.local placeholder is still in place. */
export function isMapTilerConfigured(): boolean {
  return MAPTILER_KEY !== '' && MAPTILER_KEY !== 'YOUR_MAPTILER_KEY_HERE';
}


// Kwame Nkrumah Circle, Accra — the fallback center when GPS is denied/unavailable.
export const ACCRA_FALLBACK: GeoPoint = { latitude: 5.5717, longitude: -0.2107 };

/** A map view centered on `point`; `delta` is how many degrees of map are visible
 *  (0.005 ≈ a few streets, like zoom 16). */
export function regionAround(point: GeoPoint, delta = 0.005) {
  return { latitude: point.latitude, longitude: point.longitude, latitudeDelta: delta, longitudeDelta: delta };
}
