import type { GeoPoint } from '../types/models';
import { MAPTILER_KEY, isMapTilerConfigured } from '../constants/map';

// Hosted geocoding behind small interfaces so providers can be swapped
// (MapTiler → Stadia/Geoapify, stub → real GhanaPostGPS API) without
// touching any screen. Never call OSM's public Nominatim from the app.

export type GeocodeResult = {
  point: GeoPoint;
  label: string; // short name for the label field, e.g. "Nii Boi Street"
  detail: string; // full place name for the results list
  kind: 'geocoder' | 'digital-address';
};

export interface Geocoder {
  /** Forward geocode, biased to Ghana and (optionally) proximity to `near`. */
  search(query: string, near?: GeoPoint): Promise<GeocodeResult[]>;
  /** Human-readable label for a coordinate, or null if nothing resolves. */
  reverse(point: GeoPoint): Promise<string | null>;
}

/**
 * Resolves a GhanaPostGPS digital address (e.g. "GA-183-8164") to a point.
 * House-level OSM coverage in Ghana is patchy, so this is a first-class
 * input alongside the geocoder.
 */
export interface DigitalAddressResolver {
  resolve(code: string): Promise<GeocodeResult | null>;
}

// GhanaPostGPS: 2 region/district letters, 3–4 digit area, 4 digit address.
const DIGITAL_ADDRESS_RE = /^[A-Z]{2}[-\s]?\d{3,4}[-\s]?\d{4}$/i;

export function isDigitalAddress(input: string): boolean {
  return DIGITAL_ADDRESS_RE.test(input.trim());
}

/** "gw0539 8235" → "GW-0539-8235" */
export function normalizeDigitalAddress(input: string): string {
  const compact = input.trim().toUpperCase().replace(/[-\s]/g, '');
  return `${compact.slice(0, 2)}-${compact.slice(2, -4)}-${compact.slice(-4)}`;
}

// --- MapTiler implementation ------------------------------------------------

const GEOCODING_BASE = 'https://api.maptiler.com/geocoding';

type MapTilerFeature = {
  center: [number, number]; // [lng, lat]
  text?: string;
  place_name?: string;
};

async function fetchFeatures(path: string, params: string): Promise<MapTilerFeature[]> {
  const res = await fetch(`${GEOCODING_BASE}/${path}.json?key=${MAPTILER_KEY}&${params}`);
  if (!res.ok) throw new Error(`geocoder responded ${res.status}`);
  const body = (await res.json()) as { features?: MapTilerFeature[] };
  return body.features ?? [];
}

function toResult(feature: MapTilerFeature): GeocodeResult {
  const [longitude, latitude] = feature.center;
  return {
    point: { latitude, longitude },
    label: feature.text ?? feature.place_name ?? '',
    detail: feature.place_name ?? feature.text ?? '',
    kind: 'geocoder',
  };
}

export const geocoder: Geocoder = {
  async search(query, near) {
    if (!isMapTilerConfigured() || !query.trim()) return [];
    const params = [
      'country=gh',
      'limit=6',
      'language=en',
      near ? `proximity=${near.longitude},${near.latitude}` : '',
    ]
      .filter(Boolean)
      .join('&');
    try {
      const features = await fetchFeatures(encodeURIComponent(query.trim()), params);
      return features.filter((f) => Array.isArray(f.center)).map(toResult);
    } catch {
      return []; // offline / rate-limited — the user can still place the pin by hand
    }
  },

  async reverse(point) {
    if (!isMapTilerConfigured()) return null;
    try {
      const features = await fetchFeatures(`${point.longitude},${point.latitude}`, 'limit=1&language=en');
      const first = features[0];
      return first ? (first.place_name ?? first.text ?? null) : null;
    } catch {
      return null;
    }
  },
};

// Stub until a GhanaPost GPS API key is provisioned (commercial, from Ghana
// Post). The screen already routes digital-address input here, so the real
// adapter only has to implement this one method.
export const digitalAddressResolver: DigitalAddressResolver = {
  async resolve(_code) {
    return null;
  },
};

/** True when digital-address lookup is wired to a real backend. */
export function isDigitalAddressLookupAvailable(): boolean {
  return false;
}
