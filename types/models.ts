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

// A standing weekly pickup plan. Mirrors the future RecurringPickups table;
// the backend will materialize a CollectionRequest from each plan ahead of
// its slot — the mock only projects occurrences onto the calendar.
export type RecurringPickup = {
  id: string;
  userId: string;
  wasteType: WasteType;
  volumeKg: number;
  weekday: number; // 0 = Sunday … 6 = Saturday (JS Date#getDay)
  hour: number; // pickup window start, 24h
  location: GeoPoint;
  addressText: string;
  active: boolean; // false = paused
  createdAt: string;
};

// One entry in the merged calendar feed (future GET /me/schedule):
// either a real request pinned to its scheduled day, or a projected
// occurrence of a recurring plan.
export type ScheduleItem = {
  id: string; // request id, or `${recurringId}@${dateKey}` for occurrences
  at: string; // ISO datetime of the pickup on that day
  kind: 'request' | 'recurring';
  wasteType: WasteType;
  volumeKg: number;
  addressText: string;
  status?: RequestStatus; // kind === 'request' only
  requestId?: string;
  recurringId?: string;
};

// Aggregates over completed pickups + learning (future GET /me/impact).
export type ImpactStats = {
  totalKg: number;
  co2OffsetKg: number;
  points: number; // pickup points + quiz points — the single balance shown everywhere
  completedCount: number;
};

// A user's standing on one quiz. Mirrors the future QuizResults table;
// retakes that beat the best score bank the improvement as extra points.
export type QuizResult = {
  id: string;
  userId: string;
  quizId: string; // waste type for now — one quiz per type
  bestScore: number; // correct answers on the best attempt
  totalQuestions: number;
  pointsEarned: number; // cumulative points banked from this quiz
  completedAt: string; // first completion
  updatedAt: string; // last improvement
};

// One line of the points ledger (future GET /me/points). Derived in the
// mock: pickups from completed requests, learning from quiz results.
export type PointsEntry = {
  id: string;
  source: 'pickup' | 'quiz';
  points: number;
  at: string;
  wasteType: WasteType;
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
