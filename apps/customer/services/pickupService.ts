import type {
  Collector,
  CollectionRequest,
  GeoPoint,
  ImpactStats,
  Payment,
  PaymentMethod,
  PriceQuote,
  Rating,
  RecurringPickup,
  RequestStatus,
  ScheduleItem,
  WasteType,
} from '@borlaman/shared/types/models';
import type { Enums, Tables } from '@borlaman/shared/types/database';
import { pickupPrice, type PlanFrequency } from '@borlaman/shared/constants/pricing';
import { addDays, startOfDay, toDateKey } from '@borlaman/shared/utils/datetime';
import { etaMinutes, haversineKm, moveToward, offsetKm } from '@borlaman/shared/utils/geo';
import { StorageKeys, readJson, writeJson } from './storage';
import { supabase } from './supabase';

// Pickup service on Supabase. Requests, plans, schedule and points are real
// rows; prices and status changes happen in server functions (see
// supabase/migrations). Until the rider app exists, a dev-only simulation
// walks each pickup through its statuses via dev_advance_request, with a
// mock collector for the map. Payments and ratings stay on-device until the
// payments phase.

// ── Row ↔ app mapping ────────────────────────────────────────────

type RequestRow = Tables<'pickup_requests'>;
type DbStatus = Enums<'request_status'>;

const STATUS_FROM_DB: Record<DbStatus, RequestStatus> = {
  pending: 'pending',
  claimed: 'matched',
  en_route: 'en-route',
  arrived: 'arrived',
  collecting: 'collecting',
  completed: 'completed',
  cancelled: 'cancelled',
};
const STATUS_TO_DB: Record<RequestStatus, DbStatus> = {
  pending: 'pending',
  matched: 'claimed',
  'en-route': 'en_route',
  arrived: 'arrived',
  collecting: 'collecting',
  completed: 'completed',
  cancelled: 'cancelled',
};

let simAssignments: Record<string, string> | null = null;

async function getSimAssignments(): Promise<Record<string, string>> {
  if (!simAssignments) simAssignments = await readJson<Record<string, string>>(StorageKeys.simAssignments, {});
  return simAssignments;
}

function toRequest(row: RequestRow, assignments: Record<string, string> = simAssignments ?? {}): CollectionRequest {
  return {
    id: row.id,
    userId: row.customer_id,
    collectorId: row.rider_id ?? assignments[row.id],
    wasteType: row.waste_type,
    volumeKg: row.volume_kg,
    photos: row.photos,
    location: { latitude: row.lat ?? 0, longitude: row.lng ?? 0 },
    addressText: row.address_text,
    scheduledFor: row.scheduled_for,
    status: STATUS_FROM_DB[row.status],
    priceGhs: Number(row.price_ghs),
    createdAt: row.created_at,
    completedAt: row.completed_at ?? undefined,
  };
}

function fail(error: { message: string } | null, fallback: string): never {
  throw new Error(error?.message || fallback);
}

// ── Pricing ──────────────────────────────────────────────────────
// The wizard shows constants/pricing.ts live; the server recomputes the same
// numbers in create_pickup_request, so what's charged is always the server's.

export async function getQuote(
  _pickup: GeoPoint,
  wasteType: WasteType,
  volumeKg: number,
  asap: boolean,
): Promise<PriceQuote> {
  const { sizeGhs, typeMultiplier, priorityGhs, totalGhs } = pickupPrice(volumeKg, wasteType, asap);
  return { priceGhs: totalGhs, breakdown: { sizeGhs, typeMultiplier, priorityGhs } };
}

// ── Mock fleet (dev simulation only) ─────────────────────────────

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

async function assignSimCollector(requestId: string, collectorId: string) {
  const all = await getSimAssignments();
  simAssignments = { ...all, [requestId]: collectorId };
  await writeJson(StorageKeys.simAssignments, simAssignments);
}

// ── Photos ───────────────────────────────────────────────────────

/** Uploads local photo URIs to the private pickup-photos bucket; returns storage paths.
 *  A failed upload is skipped rather than blocking the request. */
async function uploadPhotos(userId: string, uris: string[]): Promise<string[]> {
  const paths: string[] = [];
  for (const [i, uri] of uris.entries()) {
    try {
      const body = await (await fetch(uri)).arrayBuffer();
      const path = `${userId}/${Date.now().toString(36)}_${i}.jpg`;
      const { error } = await supabase.storage
        .from('pickup-photos')
        .upload(path, body, { contentType: 'image/jpeg' });
      if (!error) paths.push(path);
    } catch {
      // keep going; photos are optional
    }
  }
  return paths;
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
  asap: boolean;
  priceGhs: number; // the quote the user saw; the server's price is what's stored
};

const ACTIVE_STATUSES: RequestStatus[] = ['pending', 'matched', 'en-route', 'arrived', 'collecting'];

export async function createRequest(input: NewRequestInput): Promise<CollectionRequest> {
  const photos = await uploadPhotos(input.userId, input.photos);
  const { data, error } = await supabase.rpc('create_pickup_request', {
    p_waste_type: input.wasteType,
    p_volume_kg: input.volumeKg,
    p_lat: input.location.latitude,
    p_lng: input.location.longitude,
    p_address_text: input.addressText,
    p_asap: input.asap,
    p_scheduled_for: input.asap ? undefined : input.scheduledFor,
    p_photos: photos,
  });
  if (error || !data) fail(error, 'Could not create the pickup.');
  const request = toRequest(data, await getSimAssignments());
  ensureSimulation(request);
  return request;
}

export async function getRequests(_userId: string): Promise<CollectionRequest[]> {
  const [{ data, error }, assignments] = await Promise.all([
    supabase.from('pickup_requests').select('*').order('created_at', { ascending: false }),
    getSimAssignments(),
  ]);
  if (error) fail(error, 'Could not load your pickups.');
  return (data ?? []).map((r) => toRequest(r, assignments));
}

export async function getRequest(id: string): Promise<CollectionRequest | null> {
  const [{ data, error }, assignments] = await Promise.all([
    supabase.from('pickup_requests').select('*').eq('id', id).maybeSingle(),
    getSimAssignments(),
  ]);
  if (error) fail(error, 'Could not load the pickup.');
  return data ? toRequest(data, assignments) : null;
}

export async function getActiveRequest(userId: string): Promise<CollectionRequest | null> {
  const all = await getRequests(userId);
  return all.find((r) => ACTIVE_STATUSES.includes(r.status)) ?? null;
}

export async function cancelRequest(id: string): Promise<CollectionRequest | null> {
  stopSimulation(id);
  const { data, error } = await supabase.rpc('cancel_pickup_request', { p_request_id: id });
  if (error || !data) return getRequest(id); // already past the cancellable stage
  const cancelled = toRequest(data, await getSimAssignments());
  if (cancelled.collectorId) {
    const collector = await getCollector(cancelled.collectorId);
    if (collector) await saveCollector({ ...collector, status: 'available' });
  }
  notify(id, cancelled, null);
  return cancelled;
}

// ── Payments & ratings (on-device until the payments phase) ──────

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
    status: 'paid', // mock — MoMo/card confirm instantly until payments exist
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
// Mirrors pricing_settings (points_per_kg, co2_per_kg); the server awards the
// actual points into points_entries when a pickup completes.
export const IMPACT = {
  pointsPerKg: 6,
  co2PerKg: 0.4, // kg CO₂ avoided per kg diverted from open dumping/burning
};

export function pointsForPickup(volumeKg: number): number {
  return Math.round(volumeKg * IMPACT.pointsPerKg);
}

export async function getImpactStats(_userId: string): Promise<ImpactStats> {
  const [completed, points] = await Promise.all([
    supabase.from('pickup_requests').select('volume_kg').eq('status', 'completed'),
    supabase.from('points_entries').select('points'),
  ]);
  if (completed.error) fail(completed.error, 'Could not load your impact.');
  if (points.error) fail(points.error, 'Could not load your points.');
  const totalKg = (completed.data ?? []).reduce((sum, r) => sum + r.volume_kg, 0);
  return {
    totalKg,
    co2OffsetKg: Math.round(totalKg * IMPACT.co2PerKg),
    points: (points.data ?? []).reduce((sum, p) => sum + p.points, 0),
    completedCount: completed.data?.length ?? 0,
  };
}

// ── Recurring pickups ────────────────────────────────────────────

export type NewRecurringInput = {
  userId: string;
  wasteType: WasteType;
  volumeKg: number;
  weekdays: number[]; // 0 = Sunday … 6 = Saturday; one plan is stored per day
  frequency: PlanFrequency;
  hour: number; // pickup window start, 24h
  location: GeoPoint;
  addressText: string;
};

function toPlan(row: Tables<'recurring_plans'>): RecurringPickup {
  return {
    id: row.id,
    userId: row.customer_id,
    wasteType: row.waste_type,
    volumeKg: row.volume_kg,
    weekday: row.weekday,
    hour: row.hour,
    frequency: row.frequency,
    priceGhs: Number(row.price_ghs),
    location: { latitude: row.lat ?? 0, longitude: row.lng ?? 0 },
    addressText: row.address_text,
    active: row.active,
    createdAt: row.created_at,
  };
}

/** Creates one plan per chosen weekday ("twice a week" = two plans) so each
 *  day can be paused or removed on its own. Priced on the server. */
export async function createRecurringPickup(input: NewRecurringInput): Promise<RecurringPickup[]> {
  const { data, error } = await supabase.rpc('create_recurring_plans', {
    p_waste_type: input.wasteType,
    p_volume_kg: input.volumeKg,
    p_weekdays: input.weekdays,
    p_hour: input.hour,
    p_frequency: input.frequency,
    p_lat: input.location.latitude,
    p_lng: input.location.longitude,
    p_address_text: input.addressText,
  });
  if (error || !data) fail(error, 'Could not save the plan.');
  return data.map(toPlan);
}

export async function getRecurringPickups(_userId: string): Promise<RecurringPickup[]> {
  const { data, error } = await supabase
    .from('recurring_plans')
    .select('*')
    .order('weekday')
    .order('hour');
  if (error) fail(error, 'Could not load your plans.');
  return (data ?? []).map(toPlan);
}

export async function setRecurringActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabase.from('recurring_plans').update({ active }).eq('id', id);
  if (error) fail(error, 'Could not update the plan.');
}

export async function deleteRecurringPickup(id: string): Promise<void> {
  const { error } = await supabase.from('recurring_plans').delete().eq('id', id);
  if (error) fail(error, 'Could not delete the plan.');
}

// ── Schedule feed ────────────────────────────────────────────────
// Merges real requests with projected occurrences of active recurring plans.
// Occurrences are projected forward only; the server will materialize real
// requests from plans in the dispatch phase.

export async function getSchedule(
  userId: string,
  fromIso: string,
  toIso: string,
): Promise<ScheduleItem[]> {
  const from = new Date(fromIso);
  const to = new Date(toIso);
  const now = new Date();
  const items: ScheduleItem[] = [];

  const [requests, allPlans] = await Promise.all([getRequests(userId), getRecurringPickups(userId)]);
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

  const plans = allPlans.filter((p) => p.active);
  for (const plan of plans) {
    for (let day = startOfDay(from); day <= to; day = addDays(day, 1)) {
      if (day.getDay() !== plan.weekday) continue;
      if (plan.frequency === 'biweekly' && !onPlanWeek(plan, day)) continue;
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

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Every-2-weeks plans run on the week they were created, then every other week. */
function onPlanWeek(plan: RecurringPickup, day: Date): boolean {
  const weekStart = (d: Date) => addDays(startOfDay(d), -d.getDay()).getTime();
  const weeks = Math.round((weekStart(day) - weekStart(new Date(plan.createdAt))) / WEEK_MS);
  return weeks % 2 === 0;
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

// ── Live updates + dev simulation ────────────────────────────────
// Status changes arrive over Supabase Realtime. While the rider app doesn't
// exist, the simulation below advances the pickup on the server
// (dev_advance_request) and animates a mock collector between steps.

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

/** Advances the pickup one step on the server; null if it didn't move (e.g. cancelled). */
async function setStatus(requestId: string, status: RequestStatus): Promise<CollectionRequest | null> {
  const { data, error } = await supabase.rpc('dev_advance_request', {
    p_request_id: requestId,
    p_status: STATUS_TO_DB[status],
  });
  if (error || !data || STATUS_FROM_DB[data.status] !== status) return null;
  return toRequest(data, await getSimAssignments());
}

/** pending → matched: pick the nearest available mock collector after a short search. */
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
    await assignSimCollector(request.id, busy.id);
    const matched = await setStatus(request.id, 'matched');
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
      notify(request.id, request, moving);
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
    finishCollecting(collecting, collector);
  });
}

function finishCollecting(request: CollectionRequest, collector: Collector) {
  const sim = getSim(request.id);
  schedule(sim, COLLECTING_TO_DONE_MS, async () => {
    const done = await setStatus(request.id, 'completed');
    if (!done) return;
    await saveCollector({ ...collector, status: 'available' });
    notify(request.id, done, collector);
  });
}

/** Resumes the simulation from wherever the server-side request left off.
 *  Scheduled pickups wait for their slot; only ASAP pickups run right away. */
async function ensureSimulation(request: CollectionRequest) {
  const sim = getSim(request.id);
  const alreadyRunning = sim.timers.length > 0 || sim.interval;
  if (alreadyRunning || !ACTIVE_STATUSES.includes(request.status)) return;
  if (request.status === 'pending' && new Date(request.scheduledFor).getTime() > Date.now() + 60_000) return;

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
      if (collector) finishCollecting(request, collector);
      break;
  }
}

/**
 * Subscribes to live updates for a request. Emits the current state, then
 * every server-side change (Supabase Realtime) plus simulated movement.
 * Returns an unsubscribe function.
 */
export function subscribeToRequest(requestId: string, listener: Listener): () => void {
  const sim = getSim(requestId);
  sim.listeners.add(listener);

  const channel = supabase
    .channel(`pickup:${requestId}:${Math.random().toString(36).slice(2, 8)}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'pickup_requests', filter: `id=eq.${requestId}` },
      async (payload) => {
        const request = toRequest(payload.new as RequestRow, await getSimAssignments());
        const collector = request.collectorId ? await getCollector(request.collectorId) : null;
        listener({ request, collector });
      },
    )
    .subscribe();

  (async () => {
    const request = await getRequest(requestId);
    if (!request) return;
    const collector = request.collectorId ? await getCollector(request.collectorId) : null;
    listener({ request, collector });
    ensureSimulation(request);
  })();

  return () => {
    sim.listeners.delete(listener);
    supabase.removeChannel(channel);
  };
}

/** ETA in minutes from the collector's current position, for the tracking UI. */
export function collectorEtaMinutes(collector: Collector, pickup: GeoPoint): number {
  return etaMinutes(haversineKm(collector.currentLocation, pickup));
}
