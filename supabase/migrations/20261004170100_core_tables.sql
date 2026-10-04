-- BorlaMan core tables. Shapes follow types/models.ts in the customer app.
-- Locations are geography(Point, 4326): lng/lat, distances in metres.

-- ── Accounts ─────────────────────────────────────────────────────
-- One row per auth user, created by the on_auth_user_created trigger.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'customer',
  full_name text not null default '',
  phone text unique, -- +233XXXXXXXXX
  email text,
  category public.customer_category, -- customers only
  region text,
  district text,
  address_line text,
  area text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The single saved spot where a customer's waste is collected.
create table public.collection_points (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  location extensions.geography (Point, 4326) not null,
  label text not null,
  gps_text text, -- GhanaPostGPS, e.g. GA-183-8164
  source public.location_source not null default 'pin',
  updated_at timestamptz not null default now()
);

-- ── Pricing (read by everyone, written by admins) ────────────────
-- Mirrors constants/waste.ts SIZE_BANDS and WASTE_TYPES multipliers.
create table public.size_bands (
  kg smallint primary key, -- stored key + rough weight for impact points
  label text not null,
  hint text not null,
  short text not null,
  on_demand_ghs numeric(8, 2) not null check (on_demand_ghs >= 0),
  plan_ghs numeric(8, 2) not null check (plan_ghs >= 0),
  sort smallint not null
);

create table public.waste_type_rates (
  type public.waste_type primary key,
  label text not null,
  multiplier numeric(4, 2) not null check (multiplier > 0)
);

-- Single-row settings table.
create table public.pricing_settings (
  id boolean primary key default true check (id), -- enforces one row
  priority_fee_ghs numeric(8, 2) not null default 5,
  points_per_kg numeric(6, 2) not null default 6,
  co2_per_kg numeric(6, 3) not null default 0.4,
  updated_at timestamptz not null default now()
);

-- ── Riders (aboboyaa) ────────────────────────────────────────────
create table public.riders (
  id uuid primary key references public.profiles (id) on delete cascade,
  status public.rider_status not null default 'pending_review',
  vehicle_plate text,
  capacity_kg smallint not null default 300, -- what the tricycle carries when empty
  load_kg smallint not null default 0, -- claimed but not yet dumped
  waste_types public.waste_type[] not null default '{household,recyclables,organic,mixed}',
  payout_momo text,
  fleet_owner_id uuid references public.profiles (id) on delete set null,
  is_online boolean not null default false,
  location extensions.geography (Point, 4326),
  location_updated_at timestamptz,
  rating numeric(3, 2) not null default 5.00,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.rider_documents (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references public.riders (id) on delete cascade,
  doc_type public.rider_doc_type not null,
  storage_path text not null, -- rider-documents bucket
  reviewed boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Pickups ──────────────────────────────────────────────────────
create table public.recurring_plans (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  waste_type public.waste_type not null,
  volume_kg smallint not null references public.size_bands (kg),
  weekday smallint not null check (weekday between 0 and 6), -- 0 = Sunday
  hour smallint not null check (hour between 0 and 23),
  frequency public.plan_frequency not null default 'weekly',
  location extensions.geography (Point, 4326) not null,
  address_text text not null,
  price_ghs numeric(8, 2) not null, -- per pickup, locked in at creation
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.pickup_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  rider_id uuid references public.riders (id) on delete set null,
  plan_id uuid references public.recurring_plans (id) on delete set null,
  waste_type public.waste_type not null,
  volume_kg smallint not null references public.size_bands (kg),
  photos text[] not null default '{}', -- pickup-photos bucket paths
  location extensions.geography (Point, 4326) not null,
  address_text text not null,
  mode public.dispatch_mode not null,
  scheduled_for timestamptz not null,
  status public.request_status not null default 'pending',
  price_ghs numeric(8, 2) not null,
  size_ghs numeric(8, 2) not null,
  type_multiplier numeric(4, 2) not null,
  priority_fee_ghs numeric(8, 2) not null default 0,
  proof_photo text, -- taken by the rider at collection
  claimed_at timestamptz,
  en_route_at timestamptz,
  arrived_at timestamptz,
  collected_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

-- ── Learn & Earn ─────────────────────────────────────────────────
create table public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  quiz_id text not null,
  best_score smallint not null,
  total_questions smallint not null,
  points_earned integer not null default 0,
  completed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, quiz_id)
);

-- Append-only points ledger; written by server functions only.
create table public.points_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  source public.point_source not null,
  points integer not null,
  waste_type public.waste_type,
  ref_id uuid, -- pickup_requests.id or quiz_results.id
  created_at timestamptz not null default now()
);

-- ── Indexes ──────────────────────────────────────────────────────
create index pickup_requests_customer_idx on public.pickup_requests (customer_id, created_at desc);
create index pickup_requests_rider_idx on public.pickup_requests (rider_id) where rider_id is not null;
create index pickup_requests_open_idx on public.pickup_requests using gist (location) where status = 'pending';
create index pickup_requests_plan_idx on public.pickup_requests (plan_id) where plan_id is not null;
create index recurring_plans_customer_idx on public.recurring_plans (customer_id);
create index riders_online_location_idx on public.riders using gist (location) where is_online;
create index riders_fleet_owner_idx on public.riders (fleet_owner_id) where fleet_owner_id is not null;
create index rider_documents_rider_idx on public.rider_documents (rider_id);
create index points_entries_user_idx on public.points_entries (user_id, created_at desc);
create index quiz_results_user_idx on public.quiz_results (user_id);
create index pickup_requests_cancelled_by_idx on public.pickup_requests (cancelled_by) where cancelled_by is not null;
create index pickup_requests_volume_idx on public.pickup_requests (volume_kg);
create index recurring_plans_volume_idx on public.recurring_plans (volume_kg);

-- ── updated_at maintenance ───────────────────────────────────────
create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger collection_points_updated_at before update on public.collection_points
  for each row execute function public.set_updated_at();
create trigger quiz_results_updated_at before update on public.quiz_results
  for each row execute function public.set_updated_at();
create trigger pricing_settings_updated_at before update on public.pricing_settings
  for each row execute function public.set_updated_at();
