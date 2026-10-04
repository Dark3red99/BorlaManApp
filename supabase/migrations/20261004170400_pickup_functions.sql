-- Customer-facing server functions (called with supabase.rpc). They compute
-- prices from the pricing tables so the app can never send its own price.
-- Same formula as constants/pricing.ts: whole cedis, size × type multiplier,
-- plus the priority fee for ASAP.

create function public.quote_price(p_volume_kg smallint, p_waste_type public.waste_type, p_asap boolean)
returns table (size_ghs numeric, type_multiplier numeric, priority_fee_ghs numeric, total_ghs numeric)
language sql stable security definer set search_path = '' as $$
  select
    round(b.on_demand_ghs * w.multiplier) as size_ghs,
    w.multiplier as type_multiplier,
    case when p_asap then s.priority_fee_ghs else 0 end as priority_fee_ghs,
    round(b.on_demand_ghs * w.multiplier) + case when p_asap then s.priority_fee_ghs else 0 end as total_ghs
  from public.size_bands b, public.waste_type_rates w, public.pricing_settings s
  where b.kg = p_volume_kg and w.type = p_waste_type;
$$;

create function public.plan_price(p_volume_kg smallint, p_waste_type public.waste_type)
returns numeric
language sql stable security definer set search_path = '' as $$
  select round(b.plan_ghs * w.multiplier)
  from public.size_bands b, public.waste_type_rates w
  where b.kg = p_volume_kg and w.type = p_waste_type;
$$;

-- Creates a one-off pickup at the server-computed price.
create function public.create_pickup_request(
  p_waste_type public.waste_type,
  p_volume_kg smallint,
  p_lat double precision,
  p_lng double precision,
  p_address_text text,
  p_asap boolean,
  p_scheduled_for timestamptz default null,
  p_photos text[] default '{}'
) returns public.pickup_requests
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  q record;
  pickup_at timestamptz;
  created public.pickup_requests;
begin
  if uid is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;
  if not exists (select 1 from public.profiles where id = uid and role = 'customer') then
    raise exception 'Only customer accounts can request pickups' using errcode = '42501';
  end if;
  if coalesce(trim(p_address_text), '') = '' then
    raise exception 'Pickup address is required' using errcode = '22023';
  end if;
  if p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    raise exception 'Invalid pickup location' using errcode = '22023';
  end if;

  if p_asap then
    pickup_at := now();
  else
    if p_scheduled_for is null or p_scheduled_for < now() - interval '5 minutes'
       or p_scheduled_for > now() + interval '30 days' then
      raise exception 'Pick a time within the next 30 days' using errcode = '22023';
    end if;
    pickup_at := p_scheduled_for;
  end if;

  select * into q from public.quote_price(p_volume_kg, p_waste_type, p_asap);
  if q is null or q.total_ghs is null then
    raise exception 'Unknown load size or waste type' using errcode = '22023';
  end if;

  insert into public.pickup_requests (
    customer_id, waste_type, volume_kg, photos, location, address_text, mode,
    scheduled_for, price_ghs, size_ghs, type_multiplier, priority_fee_ghs
  ) values (
    uid, p_waste_type, p_volume_kg, coalesce(p_photos, '{}'),
    extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography,
    trim(p_address_text),
    case when p_asap then 'asap'::public.dispatch_mode else 'scheduled'::public.dispatch_mode end,
    pickup_at, q.total_ghs, q.size_ghs, q.type_multiplier, q.priority_fee_ghs
  ) returning * into created;
  return created;
end;
$$;

-- Creates one plan per weekday ("twice a week" = two plans) at the locked-in
-- plan price, so each day can be paused or removed on its own.
create function public.create_recurring_plans(
  p_waste_type public.waste_type,
  p_volume_kg smallint,
  p_weekdays smallint[],
  p_hour smallint,
  p_frequency public.plan_frequency,
  p_lat double precision,
  p_lng double precision,
  p_address_text text
) returns setof public.recurring_plans
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  price numeric := public.plan_price(p_volume_kg, p_waste_type);
begin
  if uid is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;
  if not exists (select 1 from public.profiles where id = uid and role = 'customer') then
    raise exception 'Only customer accounts can create plans' using errcode = '42501';
  end if;
  if price is null then
    raise exception 'Unknown load size or waste type' using errcode = '22023';
  end if;
  if coalesce(array_length(p_weekdays, 1), 0) = 0 then
    raise exception 'Choose at least one day' using errcode = '22023';
  end if;
  if coalesce(trim(p_address_text), '') = '' then
    raise exception 'Pickup address is required' using errcode = '22023';
  end if;

  return query
  insert into public.recurring_plans (
    customer_id, waste_type, volume_kg, weekday, hour, frequency, location, address_text, price_ghs
  )
  select
    uid, p_waste_type, p_volume_kg, d, p_hour, p_frequency,
    extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography,
    trim(p_address_text), price
  from (select distinct unnest(p_weekdays) as d) days
  returning *;
end;
$$;

-- Customers can cancel until the rider is on the way.
create function public.cancel_pickup_request(p_request_id uuid) returns public.pickup_requests
language plpgsql security definer set search_path = '' as $$
declare
  created public.pickup_requests;
begin
  update public.pickup_requests
     set status = 'cancelled', cancelled_at = now(), cancelled_by = (select auth.uid())
   where id = p_request_id
     and customer_id = (select auth.uid())
     and status in ('pending', 'claimed')
  returning * into created;
  if created.id is null then
    raise exception 'This pickup can no longer be cancelled' using errcode = '22023';
  end if;
  return created;
end;
$$;

revoke execute on function public.quote_price(smallint, public.waste_type, boolean) from public;
revoke execute on function public.plan_price(smallint, public.waste_type) from public;
revoke execute on function public.create_pickup_request(public.waste_type, smallint, double precision, double precision, text, boolean, timestamptz, text[]) from public, anon;
revoke execute on function public.create_recurring_plans(public.waste_type, smallint, smallint[], smallint, public.plan_frequency, double precision, double precision, text) from public, anon;
revoke execute on function public.cancel_pickup_request(uuid) from public, anon;

grant execute on function public.quote_price(smallint, public.waste_type, boolean) to anon, authenticated;
grant execute on function public.plan_price(smallint, public.waste_type) to anon, authenticated;
grant execute on function public.create_pickup_request(public.waste_type, smallint, double precision, double precision, text, boolean, timestamptz, text[]) to authenticated;
grant execute on function public.create_recurring_plans(public.waste_type, smallint, smallint[], smallint, public.plan_frequency, double precision, double precision, text) to authenticated;
grant execute on function public.cancel_pickup_request(uuid) to authenticated;
