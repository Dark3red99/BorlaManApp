-- Auth switched to email + password (Twilio has no Ghana trial). The phone
-- number is still collected at sign-up, so it now comes from the sign-up
-- metadata ({ phone: '+233…' }) when the auth user has none.

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  wanted text := meta ->> 'role';
  user_role public.user_role := case when wanted = 'rider' then 'rider' else 'customer' end;
  raw_phone text := coalesce(nullif(new.phone, ''), nullif(meta ->> 'phone', ''));
begin
  insert into public.profiles (id, role, full_name, phone, email, category, region, district, address_line, area)
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
    meta ->> 'area'
  );
  if user_role = 'rider' then
    insert into public.riders (id) values (new.id);
  end if;
  return new;
end;
$$;
