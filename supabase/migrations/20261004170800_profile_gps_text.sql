-- Sign-up collects an optional GhanaPostGPS code for the home address.
alter table public.profiles add column gps_text text;
grant update (gps_text) on public.profiles to authenticated;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  wanted text := meta ->> 'role';
  user_role public.user_role := case when wanted = 'rider' then 'rider' else 'customer' end;
  raw_phone text := coalesce(nullif(new.phone, ''), nullif(meta ->> 'phone', ''));
begin
  insert into public.profiles (id, role, full_name, phone, email, category, region, district, address_line, area, gps_text)
  values (
    new.id,
    user_role,
    coalesce(meta ->> 'full_name', ''),
    case when raw_phone is null then null
         when left(raw_phone, 1) = '+' then raw_phone
         else '+' || raw_phone end,
    coalesce(new.email, meta ->> 'email'),
    case when user_role = 'customer' and meta ->> 'category' in ('household', 'corporate')
         then (meta ->> 'category')::public.customer_category end,
    meta ->> 'region',
    meta ->> 'district',
    meta ->> 'address_line',
    meta ->> 'area',
    nullif(meta ->> 'gps_text', '')
  );
  if user_role = 'rider' then
    insert into public.riders (id) values (new.id);
  end if;
  return new;
end;
$$;
