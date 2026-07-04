// BorlaMan domain models.
// These shapes mirror the future backend API/DB tables (Users, Collectors,
// CollectionRequests, Payments, Ratings) so the mock service layer can be
// swapped for real HTTP/WebSocket calls without touching screens.

export type UserCategory = 'household' | 'corporate' | 'aboboyaa';

export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export type Address = {
  region: string;
  district: string;
  addressLine: string; // house no. / street
  area: string; // neighborhood
  gps?: GeoPoint | null;
  gpsText?: string; // e.g. GhanaPostGPS code, once GPS capture exists
};

export type User = {
  id: string;
  fullName: string;
  phone: string; // normalized, e.g. +233XXXXXXXXX
  email: string;
  category: UserCategory;
  address: Address;
  createdAt: string; // ISO timestamp
};

export type CollectorStatus = 'offline' | 'available' | 'on-job';

export type Collector = {
  id: string;
  name: string;
  vehicle: string; // e.g. "Aboboyaa — GR 4521-23"
  rating: number; // 0–5
  status: CollectorStatus;
  currentLocation: GeoPoint;
  wasteTypes: WasteType[];
};

export type WasteType = 'household' | 'recyclables' | 'organic' | 'ewaste' | 'mixed';

export type RequestStatus =
  | 'pending' // searching for a collector
  | 'matched' // collector accepted
  | 'en-route'
  | 'arrived'
  | 'collecting' // collector is loading the waste
  | 'completed'
  | 'cancelled';

export type CollectionRequest = {
  id: string;
  userId: string;
  collectorId?: string;
  wasteType: WasteType;
  volumeKg: number;
  photos: string[]; // local URIs for now
  location: GeoPoint;
  addressText: string;
  scheduledFor: string; // ISO timestamp
  status: RequestStatus;
  priceGhs: number;
  createdAt: string;
  completedAt?: string;
};

// Mirrors the future GET /quotes response so the estimate the user accepts
// is computed with the same formula the backend will use.
export type PriceQuote = {
  priceGhs: number;
  distanceKm: number;
  breakdown: {
    baseGhs: number;
    distanceGhs: number;
    weightGhs: number;
    typeMultiplier: number;
  };
};

export type PaymentMethod = 'momo' | 'card' | 'cash';

export type Payment = {
  id: string;
  requestId: string;
  amountGhs: number;
  method: PaymentMethod;
  status: 'pending' | 'paid' | 'failed';
  createdAt: string;
};

export type Rating = {
  id: string;
  requestId: string;
  fromUserId: string;
  toUserId: string;
  score: number; // 1–5
  review?: string;
  createdAt: string;
};
