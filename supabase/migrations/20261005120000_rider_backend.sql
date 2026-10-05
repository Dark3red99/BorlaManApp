-- Rider (aboboyaa) side: going online, live location, the bins map, claiming
-- jobs, job steps with proof photo, and the tricycle load.
-- Every rider action is a security-definer function that checks the caller
-- is an APPROVED rider; riders never write pickup rows directly.

-- Platform commission: riders see "you earn" = price × (1 − rate).
alter table public.pricing_settings add column commission_rate numeric(4, 3) not null default 0.15
  check (commission_rate >= 0 and commission_rate < 1);

-- ── Helpers ──────────────────────────────────────────────────────
-- Returns the caller's rider row only if they're approved; raises otherwise.
create or replace function private.require_approved_rider() returns public.riders
language plpgsql stable security definer set search_path = '' as $$
declare
  r public.riders;
begin
  select * into r from public.riders where id = (select auth.uid());
  if r.id is null then
    raise exception 'This account is not a rider account' using errcode = '42501';
  end if;
  if r.status <> 'approved' then
    raise exception 'Your rider account is waiting for approval' using errcode = '42501';
  end if;
  return r;
end;
$$;

-- Stable ±~150 m offset per pickup so a bin never reveals the exact house
-- and doesn't jump around between refreshes.
create or replace function private.fuzz(seed uuid, salt text) returns double precision
language sql immutable set search_path = '' as $$
  select ((abs(hashtext(seed::text || salt)) % 1000) / 1000.0 - 0.5) * 0.0028;
$$;

-- ── Online / location ────────────────────────────────────────────
create or replace function public.rider_set_online(
  p_online boolean,
  p_lat double precision default null,
  p_lng double precision default null
) returns public.riders
language plpgsql security definer set search_path = '' as $$
declare
  r public.riders := private.require_approved_rider();
  saved public.riders;
begin
  if p_online and (p_lat is null or p_lng is null) then
    raise exception 'Location is needed to go online' using errcode = '22023';
  end if;
  update public.riders set
    is_online = p_online,
    location = case when p_lat is not null and p_lng is not null
      then extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography
      else location end,
    location_updated_at = case when p_lat is not null then now() else location_updated_at end
  where id = r.id
  returning * into saved;
  return saved;
end;
$$;

create or replace function public.rider_update_location(p_lat double precision, p_lng double precision)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    raise exception 'Invalid location' using errcode = '22023';
  end if;
  update public.riders set
    location = extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography,
    location_updated_at = now()
  where id = (select auth.uid()) and status = 'approved';
end;
$$;

-- ── The bins map ─────────────────────────────────────────────────
-- Waiting pickups near the rider, filtered to the waste types they handle
-- and the room left on the tricycle. Positions are fuzzed; no address, name
-- or phone until the job is claimed. Scheduled jobs show from 2 hours
-- before their slot up to 7 days ahead.
create or replace function public.open_pickups_near(
  p_lat double precision,
  p_lng double precision,
  p_radius_m integer default 6000
) returns table (
  id uuid,
  waste_type public.waste_type,
  volume_kg smallint,
  mode public.dispatch_mode,
  scheduled_for timestamptz,
  rider_earnings_ghs numeric,
  approx_lat double precision,
  approx_lng double precision,
  distance_m integer
)
language plpgsql stable security definer set search_path = '' as $$
declare
  r public.riders := private.require_approved_rider();
  me extensions.geography := extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography;
  rate numeric := (select commission_rate from public.pricing_settings);
begin
  return query
  select
    pr.id,
    pr.waste_type,
    pr.volume_kg,
    pr.mode,
    pr.scheduled_for,
    round(pr.price_ghs * (1 - rate), 2),
    pr.lat + private.fuzz(pr.id, 'lat'),
    pr.lng + private.fuzz(pr.id, 'lng'),
    extensions.st_distance(pr.location, me)::integer
  from public.pickup_requests pr
  where pr.status = 'pending'
    and pr.rider_id is null
    and pr.waste_type = any (r.waste_types)
    and pr.volume_kg <= r.capacity_kg - r.load_kg
    and pr.scheduled_for <= now() + interval '7 days'
    and extensions.st_dwithin(pr.location, me, least(greatest(p_radius_m, 500), 20000))
  order by (pr.mode = 'asap') desc, pr.scheduled_for, 9
  limit 200;
end;
$$;

-- ── Claiming ─────────────────────────────────────────────────────
-- First rider wins: the update only succeeds while the job is still free.
create or replace function public.claim_pickup(p_request_id uuid) returns public.pickup_requests
language plpgsql security definer set search_path = '' as $$
declare
  r public.riders := private.require_approved_rider();
  claimed public.pickup_requests;
begin
  if not r.is_online then
    raise exception 'Go online to claim pickups' using errcode = '22023';
  end if;

  update public.pickup_requests pr set
    rider_id = r.id,
    status = 'claimed',
    claimed_at = now()
  where pr.id = p_request_id
    and pr.status = 'pending'
    and pr.rider_id is null
    and pr.waste_type = any (r.waste_types)
    and pr.volume_kg <= r.capacity_kg - r.load_kg
  returning * into claimed;

  if claimed.id is null then
    raise exception 'Someone else took this pickup, or it no longer fits your tricycle' using errcode = '22023';
  end if;

  update public.riders set load_kg = load_kg + claimed.volume_kg where id = r.id;
  return claimed;
end;
$$;

-- Give a job back before setting off.
create or replace function public.release_pickup(p_request_id uuid) returns public.pickup_requests
language plpgsql security definer set search_path = '' as $$
declare
  released public.pickup_requests;
begin
  update public.pickup_requests set
    rider_id = null, status = 'pending', claimed_at = null
  where id = p_request_id and rider_id = (select auth.uid()) and status = 'claimed'
  returning * into released;
  if released.id is null then
    raise exception 'Only a claimed pickup you have not started can be released' using errcode = '22023';
  end if;
  update public.riders set load_kg = greatest(0, load_kg - released.volume_kg) where id = (select auth.uid());
  return released;
end;
$$;

-- ── Job steps ────────────────────────────────────────────────────
-- claimed → en_route → arrived → collecting (proof photo required) → completed.
create or replace function public.rider_advance_pickup(
  p_request_id uuid,
  p_status public.request_status,
  p_proof_photo text default null
) returns public.pickup_requests
language plpgsql security definer set search_path = '' as $$
declare
  r public.riders := private.require_approved_rider();
  current_status public.request_status;
  saved public.pickup_requests;
  order_of constant public.request_status[] :=
    array['claimed', 'en_route', 'arrived', 'collecting', 'completed']::public.request_status[];
begin
  select status into current_status from public.pickup_requests
   where id = p_request_id and rider_id = r.id
   for update;
  if current_status is null then
    raise exception 'This pickup is not assigned to you' using errcode = '22023';
  end if;
  if array_position(order_of, p_status) is distinct from array_position(order_of, current_status) + 1 then
    raise exception 'That step is not next for this pickup' using errcode = '22023';
  end if;
  if p_status = 'collecting' and coalesce(p_proof_photo, '') = '' then
    raise exception 'Take a photo of the waste before collecting' using errcode = '22023';
  end if;
  if p_proof_photo is not null and split_part(p_proof_photo, '/', 1) <> r.id::text then
    raise exception 'Invalid proof photo' using errcode = '22023';
  end if;

  update public.pickup_requests set
    status = p_status,
    proof_photo = coalesce(p_proof_photo, proof_photo),
    en_route_at = case when p_status = 'en_route' then now() else en_route_at end,
    arrived_at = case when p_status = 'arrived' then now() else arrived_at end,
    collected_at = case when p_status = 'collecting' then now() else collected_at end,
    completed_at = case when p_status = 'completed' then now() else completed_at end
  where id = p_request_id
  returning * into saved;
  return saved;
end;
$$;

-- After unloading at a transfer station / dump site.
create or replace function public.rider_mark_emptied() returns public.riders
language plpgsql security definer set search_path = '' as $$
declare
  r public.riders := private.require_approved_rider();
  saved public.riders;
begin
  -- load still claimed but not yet collected stays on the books
  update public.riders set load_kg = coalesce((
    select sum(volume_kg) from public.pickup_requests
    where rider_id = r.id and status in ('claimed', 'en_route', 'arrived')
  ), 0)
  where id = r.id
  returning * into saved;
  return saved;
end;
$$;

-- When a customer cancels a claimed job, give the rider's capacity back.
create or replace function private.release_load_on_cancel() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'cancelled' and old.status in ('claimed', 'en_route', 'arrived') and old.rider_id is not null then
    update public.riders set load_kg = greatest(0, load_kg - old.volume_kg) where id = old.rider_id;
  end if;
  return new;
end;
$$;

create trigger pickup_requests_release_load
  after update of status on public.pickup_requests
  for each row execute function private.release_load_on_cancel();

-- ── Photos ───────────────────────────────────────────────────────
-- The assigned rider can see the customer's photos of the job; the customer
-- can see the rider's proof photo.
create policy "pickup-photos: assigned rider reads job photos" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'pickup-photos'
    and exists (
      select 1 from public.pickup_requests pr
      where pr.rider_id = (select auth.uid()) and storage.objects.name = any (pr.photos)
    )
  );

create policy "pickup-photos: customer reads proof photo" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'pickup-photos'
    and exists (
      select 1 from public.pickup_requests pr
      where pr.customer_id = (select auth.uid()) and pr.proof_photo = storage.objects.name
    )
  );

-- ── Live rider position for the customer's tracking map ──────────
alter publication supabase_realtime add table public.riders;

-- ── Grants ───────────────────────────────────────────────────────
revoke execute on function private.require_approved_rider() from public, anon, authenticated;
revoke execute on function private.fuzz(uuid, text) from public, anon, authenticated;
revoke execute on function private.release_load_on_cancel() from public, anon, authenticated;

revoke execute on function public.rider_set_online(boolean, double precision, double precision) from public, anon;
revoke execute on function public.rider_update_location(double precision, double precision) from public, anon;
revoke execute on function public.open_pickups_near(double precision, double precision, integer) from public, anon;
revoke execute on function public.claim_pickup(uuid) from public, anon;
revoke execute on function public.release_pickup(uuid) from public, anon;
revoke execute on function public.rider_advance_pickup(uuid, public.request_status, text) from public, anon;
revoke execute on function public.rider_mark_emptied() from public, anon;

grant execute on function public.rider_set_online(boolean, double precision, double precision) to authenticated;
grant execute on function public.rider_update_location(double precision, double precision) to authenticated;
grant execute on function public.open_pickups_near(double precision, double precision, integer) to authenticated;
grant execute on function public.claim_pickup(uuid) to authenticated;
grant execute on function public.release_pickup(uuid) to authenticated;
grant execute on function public.rider_advance_pickup(uuid, public.request_status, text) to authenticated;
grant execute on function public.rider_mark_emptied() to authenticated;
