-- THIKANO Supabase Storage Bucket & Policies
-- Run this third in Supabase SQL Editor

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-images',
  'property-images',
  true,
  5242880, -- 5 MB max per image
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = true,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- Anyone can view published property photos
create policy "Public read access for property images"
on storage.objects for select
using (bucket_id = 'property-images');

-- Authenticated owners upload inside their own user folder: {auth.uid()}/{property_id}/{filename}
create policy "Owners can upload images into their own folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'property-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Owners can delete only files inside their own folder; admins can delete any
create policy "Owners can delete their own uploaded images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'property-images'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
  )
);
