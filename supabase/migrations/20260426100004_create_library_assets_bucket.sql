insert into storage.buckets (id, name, public)
values ('library-assets', 'library-assets', true)
on conflict (id) do nothing;

drop policy if exists "Library assets are publicly readable" on storage.objects;
create policy "Library assets are publicly readable"
on storage.objects
for select
to public
using (bucket_id = 'library-assets');

drop policy if exists "Library staff can upload assets" on storage.objects;
create policy "Library staff can upload assets"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'library-assets'
  and public.authorize_library(
    'library_staff',
    ((storage.foldername(name))[1])::uuid
  )
);

drop policy if exists "Library staff can update assets" on storage.objects;
create policy "Library staff can update assets"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'library-assets'
  and public.authorize_library(
    'library_staff',
    ((storage.foldername(name))[1])::uuid
  )
)
with check (
  bucket_id = 'library-assets'
  and public.authorize_library(
    'library_staff',
    ((storage.foldername(name))[1])::uuid
  )
);

drop policy if exists "Library owners and platform admins can delete assets" on storage.objects;
create policy "Library owners and platform admins can delete assets"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'library-assets'
  and (
    exists (
      select 1
      from public.library_staff_memberships as memberships
      where memberships.library_id = ((storage.foldername(name))[1])::uuid
        and memberships.user_id = auth.uid()
        and memberships.library_role = 'owner'
    )
    or public.authorize('admin')
    or public.authorize('superadmin')
  )
);

comment on table storage.objects is
  'Library asset MIME type and size restrictions should be enforced in application logic and bucket settings.';
