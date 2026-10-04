-- Row-level security: every table is locked down; users see their own rows,
-- customers and riders see each other only while they share an active job.
-- Anything that sets a price, status or points goes through the security
-- definer functions in the next migration, never direct writes.

-- ── Helpers ──────────────────────────────────────────────────────
create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- True while the caller and `other` are customer + rider on an in-flight job.
create function public.shares_active_job(other uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.pickup_requests r
    where r.status in ('claimed', 'en_route', 'arrived', 'collecting')
      and (
        (r.customer_id = (select auth.uid()) and r.rider_id = other)
        or (r.rider_id = (select auth.uid()) and r.customer_id = other)
      )
  );
$$;

-- ── New auth user → profile (+ rider row) ────────────────────────
-- Sign-up metadata may ask for 'customer' or 'rider'; anything else
-- (including 'admin') falls back to customer.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  wanted text := meta ->> 'role';
  user_role public.user_role := case when wanted = 'rider' then 'rider' else 'customer' end;
begin
  insert into public.profiles (id, role, full_name, phone, email, category, region, district, address_line, area)
  values (
    new.id,
    user_role,
    coalesce(meta ->> 'full_name', ''),
    case when new.phone is null or new.phone = '' then null
         when left(new.phone, 1) = '+' then new.phone
         else '+' || new.phone end,
    coalesce(new.email, meta ->> 'email'),
    case when user_role = 'customer' and meta ->> 'category' in ('household', 'corporate')
         then (meta ->> 'category')::public.customer_category end,
    meta ->> 'region',
    meta ->> 'district',
    meta ->> 'address_line',
    meta ->> 'area'
  );
  if user_role = 'rider' then
    insert into public.riders (id) values (new.id);
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Enable RLS everywhere ────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.collection_points enable row level security;
alter table public.size_bands enable row level security;
alter table public.waste_type_rates enable row level security;
alter table public.pricing_settings enable row level security;
alter table public.riders enable row level security;
alter table public.rider_documents enable row level security;
alter table public.recurring_plans enable row level security;
alter table public.pickup_requests enable row level security;
alter table public.quiz_results enable row level security;
alter table public.points_entries enable row level security;

-- Signed-out visitors only ever read prices.
revoke all on all tables in schema public from anon;
grant select on public.size_bands, public.waste_type_rates, public.pricing_settings to anon;

-- ── Profiles ─────────────────────────────────────────────────────
create policy "profiles: read own, job partner, admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.shares_active_job(id) or public.is_admin());

create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Role and phone are not self-editable.
revoke insert, update, delete on public.profiles from authenticated;
grant update (full_name, email, category, region, district, address_line, area) on public.profiles to authenticated;

-- ── Collection point ─────────────────────────────────────────────
create policy "collection_points: own" on public.collection_points
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ── Pricing ──────────────────────────────────────────────────────
create policy "size_bands: public read" on public.size_bands for select to anon, authenticated using (true);
create policy "size_bands: admin write" on public.size_bands for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "waste_type_rates: public read" on public.waste_type_rates for select to anon, authenticated using (true);
create policy "waste_type_rates: admin write" on public.waste_type_rates for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "pricing_settings: public read" on public.pricing_settings for select to anon, authenticated using (true);
create policy "pricing_settings: admin write" on public.pricing_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ── Riders ───────────────────────────────────────────────────────
create policy "riders: read own, job partner, fleet owner, admin" on public.riders
  for select to authenticated
  using (
    id = (select auth.uid())
    or fleet_owner_id = (select auth.uid())
    or public.shares_active_job(id)
    or public.is_admin()
  );

create policy "riders: update own profile fields" on public.riders
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "riders: admin write" on public.riders
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Status, load, rating, online state and location change via functions only.
revoke insert, update, delete on public.riders from authenticated;
grant update (vehicle_plate, capacity_kg, waste_types, payout_momo) on public.riders to authenticated;

-- ── Rider documents ──────────────────────────────────────────────
create policy "rider_documents: own read" on public.rider_documents
  for select to authenticated using (rider_id = (select auth.uid()) or public.is_admin());
create policy "rider_documents: own insert" on public.rider_documents
  for insert to authenticated with check (rider_id = (select auth.uid()));
create policy "rider_documents: admin update" on public.rider_documents
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ── Recurring plans ──────────────────────────────────────────────
create policy "recurring_plans: own read" on public.recurring_plans
  for select to authenticated using (customer_id = (select auth.uid()) or public.is_admin());
create policy "recurring_plans: own pause" on public.recurring_plans
  for update to authenticated
  using (customer_id = (select auth.uid())) with check (customer_id = (select auth.uid()));
create policy "recurring_plans: own delete" on public.recurring_plans
  for delete to authenticated using (customer_id = (select auth.uid()));

-- Created via create_recurring_plans() so the price is computed server-side.
revoke insert, update on public.recurring_plans from authenticated;
grant update (active) on public.recurring_plans to authenticated;

-- ── Pickup requests ──────────────────────────────────────────────
-- Read-only to clients; created/changed via functions. Riders browse open
-- jobs through a fuzzed-location function (Phase 2), not this table.
create policy "pickup_requests: customer or assigned rider read" on public.pickup_requests
  for select to authenticated
  using (customer_id = (select auth.uid()) or rider_id = (select auth.uid()) or public.is_admin());

revoke insert, update, delete on public.pickup_requests from authenticated;

-- ── Learn & Earn ─────────────────────────────────────────────────
create policy "quiz_results: own read" on public.quiz_results
  for select to authenticated using (user_id = (select auth.uid()));
revoke insert, update, delete on public.quiz_results from authenticated;

create policy "points_entries: own read" on public.points_entries
  for select to authenticated using (user_id = (select auth.uid()));
revoke insert, update, delete on public.points_entries from authenticated;

-- Helpers are for policies, not direct calls.
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.shares_active_job(uuid) from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.shares_active_job(uuid) to authenticated;
