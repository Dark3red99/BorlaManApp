-- Phase 1: everything the customer app needs to leave its mock data.

-- ── Plain lat/lng next to every geography column ─────────────────
-- PostgREST returns geography as hex WKB; these stored columns give the
-- app readable coordinates without a view.
alter table public.pickup_requests
  add column lat double precision generated always as (extensions.st_y(location::extensions.geometry)) stored,
  add column lng double precision generated always as (extensions.st_x(location::extensions.geometry)) stored;
alter table public.recurring_plans
  add column lat double precision generated always as (extensions.st_y(location::extensions.geometry)) stored,
  add column lng double precision generated always as (extensions.st_x(location::extensions.geometry)) stored;
alter table public.collection_points
  add column lat double precision generated always as (extensions.st_y(location::extensions.geometry)) stored,
  add column lng double precision generated always as (extensions.st_x(location::extensions.geometry)) stored;
alter table public.riders
  add column lat double precision generated always as (extensions.st_y(location::extensions.geometry)) stored,
  add column lng double precision generated always as (extensions.st_x(location::extensions.geometry)) stored;

-- ── One pickup in progress at a time (same rule as the app) ──────
create or replace function private.has_active_request(uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.pickup_requests
    where customer_id = uid and status in ('pending', 'claimed', 'en_route', 'arrived', 'collecting')
  );
$$;

create or replace function private.block_second_active_request() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if private.has_active_request(new.customer_id) then
    raise exception 'You already have a pickup in progress. Complete or cancel it first.' using errcode = '23505';
  end if;
  return new;
end;
$$;

create trigger pickup_requests_one_active
  before insert on public.pickup_requests
  for each row execute function private.block_second_active_request();

-- ── Points: awarded by the server when a pickup completes ────────
create or replace function private.award_pickup_points() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    insert into public.points_entries (user_id, source, points, waste_type, ref_id)
    select new.customer_id, 'pickup', round(new.volume_kg * s.points_per_kg)::int, new.waste_type, new.id
    from public.pricing_settings s;
  end if;
  return new;
end;
$$;

create trigger pickup_requests_award_points
  after update of status on public.pickup_requests
  for each row execute function private.award_pickup_points();

-- ── Learn & Earn: server-scored quiz submissions ─────────────────
-- 10 points per correct answer the first time; retakes bank only the
-- improvement over the previous best (same as the app's mock).
create or replace function public.submit_quiz(p_quiz_id text, p_correct smallint, p_total smallint)
returns table (result public.quiz_results, points_awarded integer)
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  per_correct constant integer := 10;
  existing public.quiz_results;
  saved public.quiz_results;
  awarded integer;
begin
  if uid is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;
  if p_total not between 1 and 50 or p_correct not between 0 and p_total then
    raise exception 'Invalid quiz score' using errcode = '22023';
  end if;

  select * into existing from public.quiz_results where user_id = uid and quiz_id = p_quiz_id for update;
  if existing.id is null then
    awarded := p_correct * per_correct;
    insert into public.quiz_results (user_id, quiz_id, best_score, total_questions, points_earned)
    values (uid, p_quiz_id, p_correct, p_total, awarded)
    returning * into saved;
  else
    awarded := greatest(0, p_correct - existing.best_score) * per_correct;
    update public.quiz_results
       set best_score = greatest(best_score, p_correct),
           points_earned = points_earned + awarded,
           updated_at = case when awarded > 0 then now() else updated_at end
     where id = existing.id
    returning * into saved;
  end if;

  if awarded > 0 then
    insert into public.points_entries (user_id, source, points, waste_type, ref_id)
    values (uid, 'quiz', awarded,
            case when p_quiz_id in ('household', 'recyclables', 'organic', 'ewaste', 'mixed')
                 then p_quiz_id::public.waste_type end,
            saved.id);
  end if;

  return query select saved, awarded;
end;
$$;

-- ── Collection point ─────────────────────────────────────────────
create or replace function public.set_collection_point(
  p_lat double precision,
  p_lng double precision,
  p_label text,
  p_gps_text text default null,
  p_source public.location_source default 'pin'
) returns public.collection_points
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  saved public.collection_points;
begin
  if uid is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;
  if p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    raise exception 'Invalid location' using errcode = '22023';
  end if;
  insert into public.collection_points (user_id, location, label, gps_text, source)
  values (uid, extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography,
          coalesce(nullif(trim(p_label), ''), 'Pinned location'), nullif(trim(p_gps_text), ''), p_source)
  on conflict (user_id) do update
    set location = excluded.location, label = excluded.label,
        gps_text = excluded.gps_text, source = excluded.source
  returning * into saved;
  return saved;
end;
$$;

-- ── Dev-only rider simulation ────────────────────────────────────
-- Until the rider app exists, the customer app's demo moves its own pickup
-- through the statuses. Only works while pricing_settings.dev_simulation is
-- true. TURN IT OFF BEFORE LAUNCH (it lets customers complete their own jobs).
alter table public.pricing_settings add column dev_simulation boolean not null default true;

create or replace function public.dev_advance_request(p_request_id uuid, p_status public.request_status)
returns public.pickup_requests
language plpgsql security definer set search_path = '' as $$
declare
  saved public.pickup_requests;
  current_status public.request_status;
  order_of constant public.request_status[] :=
    array['pending', 'claimed', 'en_route', 'arrived', 'collecting', 'completed']::public.request_status[];
begin
  if not (select dev_simulation from public.pricing_settings) then
    raise exception 'Simulation is disabled' using errcode = '42501';
  end if;
  select status into current_status from public.pickup_requests
   where id = p_request_id and customer_id = (select auth.uid())
   for update;
  if current_status is null then
    raise exception 'Pickup not found' using errcode = '22023';
  end if;
  -- forward-only, one step at a time
  if array_position(order_of, p_status) is distinct from array_position(order_of, current_status) + 1 then
    return (select r from public.pickup_requests r where r.id = p_request_id);
  end if;

  update public.pickup_requests set
    status = p_status,
    claimed_at = case when p_status = 'claimed' then now() else claimed_at end,
    en_route_at = case when p_status = 'en_route' then now() else en_route_at end,
    arrived_at = case when p_status = 'arrived' then now() else arrived_at end,
    collected_at = case when p_status = 'collecting' then now() else collected_at end,
    completed_at = case when p_status = 'completed' then now() else completed_at end
  where id = p_request_id
  returning * into saved;
  return saved;
end;
$$;

-- ── Live status updates ──────────────────────────────────────────
alter publication supabase_realtime add table public.pickup_requests;

-- ── Grants ───────────────────────────────────────────────────────
revoke execute on function private.has_active_request(uuid) from public, anon, authenticated;
revoke execute on function private.block_second_active_request() from public, anon, authenticated;
revoke execute on function private.award_pickup_points() from public, anon, authenticated;
revoke execute on function public.submit_quiz(text, smallint, smallint) from public, anon;
revoke execute on function public.set_collection_point(double precision, double precision, text, text, public.location_source) from public, anon;
revoke execute on function public.dev_advance_request(uuid, public.request_status) from public, anon;
grant execute on function public.submit_quiz(text, smallint, smallint) to authenticated;
grant execute on function public.set_collection_point(double precision, double precision, text, text, public.location_source) to authenticated;
grant execute on function public.dev_advance_request(uuid, public.request_status) to authenticated;
