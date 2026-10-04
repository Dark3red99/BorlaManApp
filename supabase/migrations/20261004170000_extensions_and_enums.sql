-- BorlaMan: extensions + shared enum types.
-- PostGIS powers distance queries (nearest rider, bins near a rider).

create extension if not exists postgis with schema extensions;

create type public.user_role as enum ('customer', 'rider', 'fleet_owner', 'admin');
create type public.customer_category as enum ('household', 'corporate');
create type public.waste_type as enum ('household', 'recyclables', 'organic', 'ewaste', 'mixed');

-- Lifecycle of a pickup. 'pending' = waiting for a rider (a bin on the map
-- for scheduled jobs, an offer for ASAP); 'claimed' = a rider took it.
create type public.request_status as enum (
  'pending', 'claimed', 'en_route', 'arrived', 'collecting', 'completed', 'cancelled'
);
create type public.dispatch_mode as enum ('asap', 'scheduled');
create type public.plan_frequency as enum ('weekly', 'biweekly');
create type public.rider_status as enum ('pending_review', 'approved', 'suspended', 'rejected');
create type public.rider_doc_type as enum ('ghana_card', 'selfie', 'tricycle_photo', 'licence', 'other');
create type public.point_source as enum ('pickup', 'quiz');
create type public.location_source as enum ('gps', 'search', 'pin', 'digital_address');
