import type {
  Collector,
  CollectionRequest,
  GeoPoint,
  ImpactStats,
  Payment,
  PaymentMethod,
  PriceQuote,
  QuizResult,
  Rating,
  RecurringPickup,
  RequestStatus,
  ScheduleItem,
  WasteType,
} from '../types/models';
import { wasteMeta } from '../constants/waste';
import { addDays, startOfDay, toDateKey } from '../utils/datetime';
import { etaMinutes, haversineKm, moveToward, offsetKm } from '../utils/geo';
import { StorageKeys, readJson, writeJson } from './storage';

// Mock pickup service. Function signatures are the contract the real backend
// will implement (POST /quotes, POST /requests, Socket.IO `request:update`);
// only the bodies change when the API exists. The "live" collector movement
// is a timer-driven simulation persisted to AsyncStorage so an app restart
// resumes an in-flight pickup instead of losing it.

// ── Pricing ──────────────────────────────────────────────────────
// Same formula the backend pricing table will use:
// (base + distance·perKm + weight·perKg) × waste-type multiplier
export const PRICING = {
  baseGhs: 8,
  perKm: 2.5,
  perKg: 0.5,
  minimumGhs: 10,
};

export async function getQuote(
  pickup: GeoPoint,
  wasteType: WasteType,
  volumeKg: number,
): Promise<PriceQuote> {
  const collectors = await getFleet(pickup);
  const available = collectors.filter((c) => c.status === 'available');
  const nearestKm = available.length
    ? Math.min(...available.map((c) => haversineKm(c.currentLocation, pickup)))
    : 3; // fallback assumption when the whole fleet is busy

  const distanceKm = Math.round(nearestKm * 10) / 10;
  const multiplier = wasteMeta(wasteType).multiplier;
  const baseGhs = PRICING.baseGhs;
  const distanceGhs = distanceKm * PRICING.perKm;
  const weightGhs = volumeKg * PRICING.perKg;
  const raw = (baseGhs + distanceGhs + weightGhs) * multiplier;
  const priceGhs = Math.max(PRICING.minimumGhs, Math.round(raw * 100) / 100);

  return {
    priceGhs,
    distanceKm,
    breakdown: {
      baseGhs,
      distanceGhs: Math.round(distanceGhs * 100) / 100,
      weightGhs: Math.round(weightGhs * 100) / 100,
      typeMultiplier: multiplier,
    },
  };
}

// ── Mock fleet ───────────────────────────────────────────────────

const COLLECTOR_SEEDS = [
  { name: 'Kwame Boateng', vehicle: 'Aboboyaa — GR 4521-23', rating: 4.8 },
  { name: 'Yaw Owusu', vehicle: 'Aboboyaa — GT 1187-24', rating: 4.6 },
  { name: 'Kofi Mensah', vehicle: 'Aboboyaa — GW 3302-22', rating: 4.9 },
  { name: 'Ama Serwaa', vehicle: 'Aboboyaa — GR 7745-25', rating: 4.7 },
  { name: 'Nii Armah', vehicle: 'Aboboyaa — GA 2210-23', rating: 4.5 },
];

const ALL_WASTE_TYPES: WasteType[] = ['household', 'recyclables', 'organic', 'ewaste', 'mixed'];

function seedFleet(around: GeoPoint): Collector[] {
  return COLLECTOR_SEEDS.map((seed, i) => ({
    id: `c_${i + 1}`,
    name: seed.name,
    vehicle: seed.vehicle,
    rating: seed.rating,
    status: 'available' as const,
    // scatter 0.8–3 km around the pickup point, evenly spread directions
    currentLocation: offsetKm(around, 0.8 + Math.random() * 2.2, (i / COLLECTOR_SEEDS.length) * Math.PI * 2),
    wasteTypes: ALL_WASTE_TYPES,
  }));
}

/** Returns the mock fleet, (re)seeding it around `near` if empty or too far away. */
async function getFleet(near: GeoPoint): Promise<Collector[]> {
  let fleet = await readJson<Collector[]>(StorageKeys.collectors, []);
  const nearestKm = fleet.length
    ? Math.min(...fleet.map((c) => haversineKm(c.currentLocation, near)))
    : Infinity;
  // never reseed while a collector is mid-job — it would orphan the active request
  if (nearestKm > 8 && !fleet.some((c) => c.status === 'on-job')) {
    fleet = seedFleet(near);
    await writeJson(StorageKeys.collectors, fleet);
  }
  return fleet;
}

async function saveCollector(collector: Collector): Promise<void> {
  const fleet = await readJson<Collector[]>(StorageKeys.collectors, []);
  const idx = fleet.findIndex((c) => c.id === collector.id);
  if (idx === -1) fleet.push(collector);
  else fleet[idx] = collector;
  await writeJson(StorageKeys.collectors, fleet);
}

export async function getCollector(id: string): Promise<Collector | null> {
  const fleet = await readJson<Collector[]>(StorageKeys.collectors, []);
  return fleet.find((c) => c.id === id) ?? null;
}

// ── Requests ─────────────────────────────────────────────────────

export type NewRequestInput = {
  userId: string;
  wasteType: WasteType;
  volumeKg: number;
  photos: string[];
  location: GeoPoint;
  addressText: string;
  scheduledFor: string; // ISO; "now" for ASAP requests
  priceGhs: number; // the quote the user accepted
};

const ACTIVE_STATUSES: RequestStatus[] = ['pending', 'matched', 'en-route', 'arrived', 'collecting'];

async function getAllRequests(): Promise<CollectionRequest[]> {
  return readJson<CollectionRequest[]>(StorageKeys.requests, []);
}

async function saveRequest(request: CollectionRequest): Promise<void> {
  const all = await getAllRequests();
  const idx = all.findIndex((r) => r.id === request.id);
  if (idx === -1) all.push(request);
  else all[idx] = request;
  await writeJson(StorageKeys.requests, all);
}

export async function createRequest(input: NewRequestInput): Promise<CollectionRequest> {
  const active = await getActiveRequest(input.userId);
  if (active) {
    throw new Error('You already have a pickup in progress. Complete or cancel it first.');
  }
  const request: CollectionRequest = {
    id: `r_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    userId: input.userId,
    wasteType: input.wasteType,
    volumeKg: input.volumeKg,
    photos: input.photos,
    location: input.location,
    addressText: input.addressText,
    scheduledFor: input.scheduledFor,
    status: 'pending',
    priceGhs: input.priceGhs,
    createdAt: new Date().toISOString(),
  };
  await saveRequest(request);
  ensureSimulation(request);
  return request;
}

export async function getRequests(userId: string): Promise<CollectionRequest[]> {
  const all = await getAllRequests();
  return all
    .filter((r) => r.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getRequest(id: string): Promise<CollectionRequest | null> {
  const all = await getAllRequests();
  return all.find((r) => r.id === id) ?? null;
}

export async function getActiveRequest(userId: string): Promise<CollectionRequest | null> {
  const all = await getRequests(userId);
  return all.find((r) => ACTIVE_STATUSES.includes(r.status)) ?? null;
}

export async function cancelRequest(id: string): Promise<CollectionRequest | null> {
  stopSimulation(id);
  const request = await getRequest(id);
  if (!request || !ACTIVE_STATUSES.includes(request.status)) return request;
  const cancelled: CollectionRequest = { ...request, status: 'cancelled' };
  await saveRequest(cancelled);
  if (request.collectorId) {
    const collector = await getCollector(request.collectorId);
    if (collector) await saveCollector({ ...collector, status: 'available' });
  }
  notify(id, cancelled, null);
  return cancelled;
}

// ── Payments & ratings ───────────────────────────────────────────

export async function recordPayment(
  requestId: string,
  amountGhs: number,
  method: PaymentMethod,
): Promise<Payment> {
  const payments = await readJson<Payment[]>(StorageKeys.payments, []);
  const payment: Payment = {
    id: `p_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    requestId,
    amountGhs,
    method,
    status: 'paid', // mock — MoMo/card confirm instantly until the backend exists
    createdAt: new Date().toISOString(),
  };
  await writeJson(StorageKeys.payments, [...payments, payment]);
  return payment;
}

export async function getPaymentForRequest(requestId: string): Promise<Payment | null> {
  const payments = await readJson<Payment[]>(StorageKeys.payments, []);
  return payments.find((p) => p.requestId === requestId) ?? null;
}

export async function submitRating(
  requestId: string,
  fromUserId: string,
  toUserId: string,
  score: number,
  review?: string,
): Promise<Rating> {
  const ratings = await readJson<Rating[]>(StorageKeys.ratings, []);
  const rating: Rating = {
    id: `rt_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    requestId,
    fromUserId,
    toUserId,
    score,
    review,
    createdAt: new Date().toISOString(),
  };
  await writeJson(StorageKeys.ratings, [...ratings, rating]);
  return rating;
}

// ── Impact ───────────────────────────────────────────────────────
// Mock conversion factors; the backend impact service will own these.
export const IMPACT = {
  pointsPerKg: 6,
  co2PerKg: 0.4, // kg CO₂ avoided per kg diverted from open dumping/burning
};

export function pointsForPickup(volumeKg: number): number {
  return Math.round(volumeKg * IMPACT.pointsPerKg);
}

export async function getImpactStats(userId: string): Promise<ImpactStats> {
  const completed = (await getRequests(userId)).filter((r) => r.status === 'completed');
  const totalKg = completed.reduce((sum, r) => sum + r.volumeKg, 0);
  // summed per pickup so the total matches the points shown on each receipt
  const pickupPoints = completed.reduce((sum, r) => sum + pointsForPickup(r.volumeKg), 0);
  // Learn & Earn quiz points share this balance; read straight from storage
  // (not learnService) to keep the service dependency one-way. The backend
  // /me/impact will join both sources server-side.
  const quizResults = await readJson<QuizResult[]>(StorageKeys.quizResults, []);
  const quizPoints = quizResults
    .filter((q) => q.userId === userId)
    .reduce((sum, q) => sum + q.pointsEarned, 0);
  return {
    totalKg,
    co2OffsetKg: Math.round(totalKg * IMPACT.co2PerKg),
    points: pickupPoints + quizPoints,
    completedCount: completed.length,
  };
}

// ── Recurring pickups ────────────────────────────────────────────

export type NewRecurringInput = {
  userId: string;
  wasteType: WasteType;
  volumeKg: number;
  weekday: number; // 0 = Sunday … 6 = Saturday
  hour: number; // pickup window start, 24h
  location: GeoPoint;
  addressText: string;
};

async function getAllRecurring(): Promise<RecurringPickup[]> {
  return readJson<RecurringPickup[]>(StorageKeys.recurring, []);
}

export async function createRecurringPickup(input: NewRecurringInput): Promise<RecurringPickup> {
  const plan: RecurringPickup = {
    id: `rc_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    ...input,
    active: true,
    createdAt: new Date().toISOString(),
  };
  await writeJson(StorageKeys.recurring, [...(await getAllRecurring()), plan]);
  return plan;
}

export async function getRecurringPickups(userId: string): Promise<RecurringPickup[]> {
  const all = await getAllRecurring();
  return all
    .filter((p) => p.userId === userId)
    .sort((a, b) => a.weekday - b.weekday || a.hour - b.hour);
}

export async function setRecurringActive(id: string, active: boolean): Promise<void> {
  const all = await getAllRecurring();
  await writeJson(StorageKeys.recurring, all.map((p) => (p.id === id ? { ...p, active } : p)));
}

export async function deleteRecurringPickup(id: string): Promise<void> {
  const all = await getAllRecurring();
  await writeJson(StorageKeys.recurring, all.filter((p) => p.id !== id));
}

// ── Schedule feed ────────────────────────────────────────────────
// Merges real requests with projected occurrences of active recurring plans
// (the future GET /me/schedule?from&to). Occurrences are projected forward
// only — the mock never backfills plan slots that already passed; the real
// backend will materialize requests from plans instead.

export async function getSchedule(
  userId: string,
  fromIso: string,
  toIso: string,
): Promise<ScheduleItem[]> {
  const from = new Date(fromIso);
  const to = new Date(toIso);
  const now = new Date();
  const items: ScheduleItem[] = [];

  const requests = await getRequests(userId);
  for (const r of requests) {
    if (r.status === 'cancelled') continue;
    const at = new Date(r.scheduledFor);
    if (at < from || at > to) continue;
    items.push({
      id: r.id,
      at: r.scheduledFor,
      kind: 'request',
      wasteType: r.wasteType,
      volumeKg: r.volumeKg,
      addressText: r.addressText,
      status: r.status,
      requestId: r.id,
    });
  }

  const plans = (await getRecurringPickups(userId)).filter((p) => p.active);
  for (const plan of plans) {
    for (let day = startOfDay(from); day <= to; day = addDays(day, 1)) {
      if (day.getDay() !== plan.weekday) continue;
      const at = new Date(day);
      at.setHours(plan.hour, 0, 0, 0);
      if (at < now || at < from || at > to) continue;
      items.push({
        id: `${plan.id}@${toDateKey(day)}`,
        at: at.toISOString(),
        kind: 'recurring',
        wasteType: plan.wasteType,
        volumeKg: plan.volumeKg,
        addressText: plan.addressText,
        recurringId: plan.id,
      });
    }
  }

  return items.sort((a, b) => a.at.localeCompare(b.at));
}

export type NextPickup =
  | { kind: 'active'; request: CollectionRequest }
  | { kind: 'upcoming'; item: ScheduleItem };

/** The Home card's data: an in-flight request wins; otherwise the nearest
 *  upcoming schedule item within two weeks. */
export async function getNextPickup(userId: string): Promise<NextPickup | null> {
  const active = await getActiveRequest(userId);
  if (active) return { kind: 'active', request: active };
  const now = new Date();
  const items = await getSchedule(userId, now.toISOString(), addDays(now, 14).toISOString());
  const upcoming = items.find((i) => new Date(i.at) > now && i.status !== 'completed');
  return upcoming ? { kind: 'upcoming', item: upcoming } : null;
}

// ── Live tracking simulation ─────────────────────────────────────
// Stands in for the Socket.IO `request:update` channel. Subscribers get the
// latest request + collector (with a moving currentLocation) until the
// request reaches a terminal status.

export type RequestUpdate = {
  request: CollectionRequest;
  collector: Collector | null;
};

type Listener = (update: RequestUpdate) => void;

type SimState = {
  timers: ReturnType<typeof setTimeout>[];
  interval?: ReturnType<typeof setInterval>;
  listeners: Set<Listener>;
};

const sims = new Map<string, SimState>();

const MATCH_DELAY_MS = 4500;
const ACCEPT_TO_DEPART_MS = 2500;
const TICK_MS = 1200;
const TRIP_TICKS = 30; // collector reaches you in ~36 s of demo time
const ARRIVED_TO_COLLECTING_MS = 4000;
const COLLECTING_TO_DONE_MS = 8000;

function getSim(requestId: string): SimState {
  let sim = sims.get(requestId);
  if (!sim) {
    sim = { timers: [], listeners: new Set() };
    sims.set(requestId, sim);
  }
  return sim;
}

function notify(requestId: string, request: CollectionRequest, collector: Collector | null) {
  sims.get(requestId)?.listeners.forEach((l) => l({ request, collector }));
}

function stopSimulation(requestId: string) {
  const sim = sims.get(requestId);
  if (!sim) return;
  sim.timers.forEach(clearTimeout);
  sim.timers = [];
  if (sim.interval) clearInterval(sim.interval);
  sim.interval = undefined;
}

function schedule(sim: SimState, ms: number, fn: () => void) {
  sim.timers.push(setTimeout(fn, ms));
}

async function setStatus(
  requestId: string,
  status: RequestStatus,
  extra?: Partial<CollectionRequest>,
): Promise<CollectionRequest | null> {
  const request = await getRequest(requestId);
  if (!request || !ACTIVE_STATUSES.includes(request.status)) return null; // cancelled meanwhile
  const updated: CollectionRequest = { ...request, ...extra, status };
  await saveRequest(updated);
  return updated;
}

/** pending → matched: pick the nearest available collector after a short search. */
function runMatching(request: CollectionRequest) {
  const sim = getSim(request.id);
  schedule(sim, MATCH_DELAY_MS, async () => {
    const fleet = await getFleet(request.location);
    const available = fleet
      .filter((c) => c.status === 'available')
      .sort(
        (a, b) =>
          haversineKm(a.currentLocation, request.location) -
          haversineKm(b.currentLocation, request.location),
      );
    const collector = available[0] ?? fleet[0]; // mock never truly fails to match
    const busy: Collector = { ...collector, status: 'on-job' };
    await saveCollector(busy);
    const matched = await setStatus(request.id, 'matched', { collectorId: busy.id });
    if (!matched) return;
    notify(request.id, matched, busy);

    schedule(sim, ACCEPT_TO_DEPART_MS, async () => {
      const enRoute = await setStatus(request.id, 'en-route');
      if (!enRoute) return;
      notify(request.id, enRoute, busy);
      runTrip(enRoute, busy);
    });
  });
}

/** en-route → arrived: move the collector toward the pickup point each tick. */
function runTrip(request: CollectionRequest, collector: Collector) {
  const sim = getSim(request.id);
  const totalKm = haversineKm(collector.currentLocation, request.location);
  const stepKm = Math.max(totalKm / TRIP_TICKS, 0.02);
  let position = collector.currentLocation;

  sim.interval = setInterval(async () => {
    position = moveToward(position, request.location, stepKm);
    const moving: Collector = { ...collector, currentLocation: position };
    const arrived = haversineKm(position, request.location) < 0.01;

    if (!arrived) {
      const current = await getRequest(request.id);
      if (!current || current.status !== 'en-route') {
        stopSimulation(request.id);
        return;
      }
      notify(request.id, current, moving);
      return;
    }

    stopSimulation(request.id);
    await saveCollector(moving);
    const atDoor = await setStatus(request.id, 'arrived');
    if (!atDoor) return;
    notify(request.id, atDoor, moving);
    runHandover(atDoor, moving);
  }, TICK_MS);
}

/** arrived → collecting → completed, then free the collector. */
function runHandover(request: CollectionRequest, collector: Collector) {
  const sim = getSim(request.id);
  schedule(sim, ARRIVED_TO_COLLECTING_MS, async () => {
    const collecting = await setStatus(request.id, 'collecting');
    if (!collecting) return;
    notify(request.id, collecting, collector);

    schedule(sim, COLLECTING_TO_DONE_MS, async () => {
      const done = await setStatus(request.id, 'completed', {
        completedAt: new Date().toISOString(),
      });
      if (!done) return;
      await saveCollector({ ...collector, status: 'available' });
      notify(request.id, done, collector);
    });
  });
}

/** Resumes the state machine from wherever the persisted request left off. */
async function ensureSimulation(request: CollectionRequest) {
  const sim = getSim(request.id);
  const alreadyRunning = sim.timers.length > 0 || sim.interval;
  if (alreadyRunning || !ACTIVE_STATUSES.includes(request.status)) return;

  const collector = request.collectorId ? await getCollector(request.collectorId) : null;
  switch (request.status) {
    case 'pending':
      runMatching(request);
      break;
    case 'matched':
      schedule(sim, ACCEPT_TO_DEPART_MS, async () => {
        const enRoute = await setStatus(request.id, 'en-route');
        if (!enRoute || !collector) return;
        notify(request.id, enRoute, collector);
        runTrip(enRoute, collector);
      });
      break;
    case 'en-route':
      if (collector) runTrip(request, collector);
      break;
    case 'arrived':
      if (collector) runHandover(request, collector);
      break;
    case 'collecting':
      if (collector) {
        schedule(sim, COLLECTING_TO_DONE_MS, async () => {
          const done = await setStatus(request.id, 'completed', {
            completedAt: new Date().toISOString(),
          });
          if (!done) return;
          await saveCollector({ ...collector, status: 'available' });
          notify(request.id, done, collector);
        });
      }
      break;
  }
}

/**
 * Subscribes to live updates for a request (the future Socket.IO channel).
 * Immediately emits the current state, then streams simulation updates.
 * Returns an unsubscribe function.
 */
export function subscribeToRequest(requestId: string, listener: Listener): () => void {
  const sim = getSim(requestId);
  sim.listeners.add(listener);

  (async () => {
    const request = await getRequest(requestId);
    if (!request) return;
    const collector = request.collectorId ? await getCollector(request.collectorId) : null;
    listener({ request, collector });
    ensureSimulation(request);
  })();

  return () => {
    sim.listeners.delete(listener);
  };
}

/** ETA in minutes from the collector's current position, for the tracking UI. */
export function collectorEtaMinutes(collector: Collector, pickup: GeoPoint): number {
  return etaMinutes(haversineKm(collector.currentLocation, pickup));
}
