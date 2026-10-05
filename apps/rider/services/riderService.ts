import type { Enums, Tables } from '@borlaman/shared/types/database';
import type { WasteType } from '@borlaman/shared/types/models';
import { supabase } from './supabase';

// Everything the rider app asks the backend. Rider actions (online, claim,
// job steps) are server functions that check the caller is an approved
// rider; see supabase/migrations/20261005120000_rider_backend.sql.

export type Profile = Tables<'profiles'>;
export type RiderRow = Tables<'riders'>;
export type JobRow = Tables<'pickup_requests'>;
export type JobStatus = Enums<'request_status'>;
export type DocType = Enums<'rider_doc_type'>;

/** A waiting pickup on the bins map. Position is approximate until claimed. */
export type OpenBin = {
  id: string;
  wasteType: WasteType;
  volumeKg: number;
  mode: Enums<'dispatch_mode'>;
  scheduledFor: string;
  earningsGhs: number;
  latitude: number;
  longitude: number;
  distanceM: number;
};

/** A claimed job with what the rider needs to do it. */
export type Job = JobRow & {
  customerName: string;
  customerPhone: string | null;
  earningsGhs: number;
};

export class RiderError extends Error {}

function fail(error: { message: string } | null, fallback: string): never {
  const message = error?.message ?? fallback;
  if (/network|fetch/i.test(message)) throw new RiderError('No connection. Check your internet and try again.');
  throw new RiderError(message);
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  if (digits.startsWith('+233')) return digits;
  if (digits.startsWith('233')) return `+${digits}`;
  if (digits.startsWith('0')) return `+233${digits.slice(1)}`;
  return `+233${digits}`;
}

// ── Account ──────────────────────────────────────────────────────

export async function signUp(input: { fullName: string; phone: string; email: string; password: string }) {
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: {
      data: { role: 'rider', full_name: input.fullName.trim(), phone: normalizePhone(input.phone) },
    },
  });
  if (error) {
    if (/already registered|already exists/i.test(error.message)) fail(null, 'An account with this email already exists.');
    if (/database error saving new user/i.test(error.message)) fail(null, 'An account with this phone number already exists.');
    fail(error, 'Could not create your account.');
  }
  if (data.user && data.user.identities?.length === 0) fail(null, 'An account with this email already exists.');
  if (!data.session) fail(null, 'Account created. Confirm your email, then sign in.');
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) {
    if (/not confirmed/i.test(error.message)) fail(null, 'Confirm your email first, then sign in.');
    if (/network|fetch/i.test(error.message)) fail(error, '');
    fail(null, 'Incorrect email or password.');
  }
}

export async function signOut() {
  await supabase.auth.signOut();
}

/** The signed-in user's profile and rider row (rider is null for customer accounts). */
export async function loadMe(): Promise<{ profile: Profile; rider: RiderRow | null } | null> {
  const { data: session } = await supabase.auth.getSession();
  const uid = session.session?.user.id;
  if (!uid) return null;
  const [profile, rider] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', uid).single(),
    supabase.from('riders').select('*').eq('id', uid).maybeSingle(),
  ]);
  if (profile.error || !profile.data) fail(profile.error, 'Could not load your account.');
  return { profile: profile.data, rider: rider.data ?? null };
}

// ── Onboarding ───────────────────────────────────────────────────

export async function saveRiderDetails(details: {
  vehiclePlate: string;
  capacityKg: number;
  wasteTypes: WasteType[];
  payoutMomo: string;
}) {
  const { data: session } = await supabase.auth.getSession();
  const uid = session.session?.user.id;
  if (!uid) fail(null, 'Please sign in again.');
  const { error } = await supabase
    .from('riders')
    .update({
      vehicle_plate: details.vehiclePlate.trim().toUpperCase(),
      capacity_kg: details.capacityKg,
      waste_types: details.wasteTypes,
      payout_momo: normalizePhone(details.payoutMomo),
    })
    .eq('id', uid);
  if (error) fail(error, 'Could not save your details.');
}

async function uploadImage(bucket: 'rider-documents' | 'pickup-photos', uri: string, name: string): Promise<string> {
  const { data: session } = await supabase.auth.getSession();
  const uid = session.session?.user.id;
  if (!uid) fail(null, 'Please sign in again.');
  const body = await (await fetch(uri)).arrayBuffer();
  const path = `${uid}/${name}_${Date.now().toString(36)}.jpg`;
  const { error } = await supabase.storage.from(bucket).upload(path, body, { contentType: 'image/jpeg' });
  if (error) fail(error, 'Photo upload failed. Try again.');
  return path;
}

export async function uploadDocument(docType: DocType, uri: string) {
  const path = await uploadImage('rider-documents', uri, docType);
  const { data: session } = await supabase.auth.getSession();
  const { error } = await supabase
    .from('rider_documents')
    .insert({ rider_id: session.session!.user.id, doc_type: docType, storage_path: path });
  if (error) fail(error, 'Could not save the document.');
}

export async function getMyDocumentTypes(): Promise<DocType[]> {
  const { data, error } = await supabase.from('rider_documents').select('doc_type');
  if (error) fail(error, 'Could not load your documents.');
  return [...new Set((data ?? []).map((d) => d.doc_type))];
}

// ── Online + location ────────────────────────────────────────────

export async function setOnline(online: boolean, coords?: { latitude: number; longitude: number }) {
  const { data, error } = await supabase.rpc('rider_set_online', {
    p_online: online,
    p_lat: coords?.latitude ?? null,
    p_lng: coords?.longitude ?? null,
  });
  if (error || !data) fail(error, 'Could not change your status.');
  return data;
}

export async function sendLocation(latitude: number, longitude: number) {
  await supabase.rpc('rider_update_location', { p_lat: latitude, p_lng: longitude });
}

export async function markEmptied() {
  const { data, error } = await supabase.rpc('rider_mark_emptied');
  if (error || !data) fail(error, 'Could not update your load.');
  return data;
}

// ── Bins + jobs ──────────────────────────────────────────────────

export async function getOpenBins(latitude: number, longitude: number): Promise<OpenBin[]> {
  const { data, error } = await supabase.rpc('open_pickups_near', { p_lat: latitude, p_lng: longitude });
  if (error) fail(error, 'Could not load pickups near you.');
  return (data ?? []).map((b) => ({
    id: b.id,
    wasteType: b.waste_type,
    volumeKg: b.volume_kg,
    mode: b.mode,
    scheduledFor: b.scheduled_for,
    earningsGhs: Number(b.rider_earnings_ghs),
    latitude: b.approx_lat,
    longitude: b.approx_lng,
    distanceM: b.distance_m,
  }));
}

async function commissionRate(): Promise<number> {
  const { data } = await supabase.from('pricing_settings').select('commission_rate').single();
  return Number(data?.commission_rate ?? 0.15);
}

async function toJobs(rows: JobRow[]): Promise<Job[]> {
  if (rows.length === 0) return [];
  const ids = [...new Set(rows.map((r) => r.customer_id))];
  const [{ data: customers }, rate] = await Promise.all([
    supabase.from('profiles').select('id, full_name, phone').in('id', ids),
    commissionRate(),
  ]);
  return rows.map((r) => {
    const c = customers?.find((p) => p.id === r.customer_id);
    return {
      ...r,
      customerName: c?.full_name || 'Customer',
      customerPhone: c?.phone ?? null,
      earningsGhs: Math.round(Number(r.price_ghs) * (1 - rate) * 100) / 100,
    };
  });
}

/** Jobs the rider has claimed and not finished, soonest first. */
export async function getActiveJobs(): Promise<Job[]> {
  const { data, error } = await supabase
    .from('pickup_requests')
    .select('*')
    .in('status', ['claimed', 'en_route', 'arrived', 'collecting'])
    .order('scheduled_for');
  if (error) fail(error, 'Could not load your jobs.');
  return toJobs(data ?? []);
}

export async function getJob(id: string): Promise<Job | null> {
  const { data, error } = await supabase.from('pickup_requests').select('*').eq('id', id).maybeSingle();
  if (error) fail(error, 'Could not load the job.');
  return data ? (await toJobs([data]))[0] : null;
}

/** Today's completed jobs and what the rider earned from them. */
export async function getTodayEarnings(): Promise<{ jobs: number; ghs: number }> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const { data: session } = await supabase.auth.getSession();
  const [{ data }, rate] = await Promise.all([
    supabase
      .from('pickup_requests')
      .select('price_ghs')
      .eq('rider_id', session.session?.user.id ?? '')
      .eq('status', 'completed')
      .gte('completed_at', start.toISOString()),
    commissionRate(),
  ]);
  const gross = (data ?? []).reduce((sum, r) => sum + Number(r.price_ghs), 0);
  return { jobs: data?.length ?? 0, ghs: Math.round(gross * (1 - rate) * 100) / 100 };
}

export async function claim(binId: string) {
  const { data, error } = await supabase.rpc('claim_pickup', { p_request_id: binId });
  if (error || !data) fail(error, 'Could not claim this pickup.');
  return data;
}

export async function release(jobId: string) {
  const { error } = await supabase.rpc('release_pickup', { p_request_id: jobId });
  if (error) fail(error, 'Could not release this pickup.');
}

/** Moves the job to its next step. Collecting needs a proof photo (local URI). */
export async function advance(jobId: string, next: JobStatus, proofUri?: string) {
  const proof = proofUri ? await uploadImage('pickup-photos', proofUri, `proof_${jobId.slice(0, 8)}`) : null;
  const { data, error } = await supabase.rpc('rider_advance_pickup', {
    p_request_id: jobId,
    p_status: next,
    p_proof_photo: proof,
  });
  if (error || !data) fail(error, 'Could not update the job.');
  return data;
}

/** Temporary links to the customer's photos of the job. */
export async function getPhotoUrls(paths: string[]): Promise<string[]> {
  if (paths.length === 0) return [];
  const { data } = await supabase.storage.from('pickup-photos').createSignedUrls(paths, 60 * 30);
  return (data ?? []).map((d) => d.signedUrl).filter((u): u is string => !!u);
}
