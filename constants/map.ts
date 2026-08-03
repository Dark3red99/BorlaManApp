import type { GeoPoint } from '../types/models';

// Hosted map/geocoding provider config. One MapTiler key covers both the
// tile style and the geocoder; it is inlined into the bundle at build time
// (EXPO_PUBLIC_*), so restrict it by app ID in the MapTiler dashboard.

export const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY ?? '';

/** False while the .env.local placeholder is still in place. */
export function isMapTilerConfigured(): boolean {
  return MAPTILER_KEY !== '' && MAPTILER_KEY !== 'YOUR_MAPTILER_KEY_HERE';
}

export const MAP_STYLE_URL = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;

// Kwame Nkrumah Circle, Accra — the fallback center when GPS is denied/unavailable.
export const ACCRA_FALLBACK: GeoPoint = { latitude: 5.5717, longitude: -0.2107 };
