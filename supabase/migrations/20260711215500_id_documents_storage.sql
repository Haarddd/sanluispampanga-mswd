-- Create storage bucket for ID documents
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'id-documents',
  'id-documents',
  true,
  5242880, -- 5MB
  array['image/jpeg', 'image/png']
)
on conflict (id) do nothing;

-- Storage policies: users can upload to their own folder
create policy "Users can upload their own ID"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'id-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can view their own ID"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'id-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Admins can view all IDs"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'id-documents'
    and public.is_admin()
  );
