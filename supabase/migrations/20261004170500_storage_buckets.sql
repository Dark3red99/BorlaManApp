-- Private buckets. Files live under "<user id>/..." and only the owner can
-- upload or read them; riders get access to a job's photos through signed
-- URLs issued by server functions (Phase 2).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('pickup-photos', 'pickup-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('rider-documents', 'rider-documents', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']);

create policy "pickup-photos: owner upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'pickup-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "pickup-photos: owner read" on storage.objects
  for select to authenticated
  using (bucket_id = 'pickup-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "pickup-photos: owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'pickup-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "rider-documents: owner upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'rider-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "rider-documents: owner or admin read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'rider-documents'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin())
  );
