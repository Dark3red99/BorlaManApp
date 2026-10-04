-- Fixes from the Supabase security/performance advisors.

-- Pricing reads only public tables, so it doesn't need definer rights.
alter function public.quote_price(smallint, public.waste_type, boolean) security invoker;
alter function public.plan_price(smallint, public.waste_type) security invoker;

-- Policy helpers move out of the API-exposed schema so they can't be called
-- over /rpc. Policies reference functions by OID, so they keep working.
create schema if not exists private;
grant usage on schema private to authenticated;
alter function public.is_admin() set schema private;
alter function public.shares_active_job(uuid) set schema private;

-- Supabase's built-in RLS auto-enable helper isn't meant to be called by clients.
revoke execute on function public.rls_auto_enable() from anon, authenticated, public;

-- One permissive policy per role+action: split "admin write" (for all) so it
-- no longer overlaps the public/own SELECT policies.
drop policy "size_bands: admin write" on public.size_bands;
create policy "size_bands: admin insert" on public.size_bands for insert to authenticated with check (private.is_admin());
create policy "size_bands: admin update" on public.size_bands for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "size_bands: admin delete" on public.size_bands for delete to authenticated using (private.is_admin());

drop policy "waste_type_rates: admin write" on public.waste_type_rates;
create policy "waste_type_rates: admin insert" on public.waste_type_rates for insert to authenticated with check (private.is_admin());
create policy "waste_type_rates: admin update" on public.waste_type_rates for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "waste_type_rates: admin delete" on public.waste_type_rates for delete to authenticated using (private.is_admin());

drop policy "pricing_settings: admin write" on public.pricing_settings;
create policy "pricing_settings: admin update" on public.pricing_settings for update to authenticated using (private.is_admin()) with check (private.is_admin());

drop policy "riders: admin write" on public.riders;
drop policy "riders: update own profile fields" on public.riders;
create policy "riders: update own or admin" on public.riders for update to authenticated
  using (id = (select auth.uid()) or private.is_admin())
  with check (id = (select auth.uid()) or private.is_admin());
create policy "riders: admin insert" on public.riders for insert to authenticated with check (private.is_admin());
create policy "riders: admin delete" on public.riders for delete to authenticated using (private.is_admin());
