create extension if not exists moddatetime with schema extensions;

alter table public.libraries
  add column if not exists slug text,
  add column if not exists description text,
  add column if not exists logo_url text,
  add column if not exists banner_url text,
  add column if not exists address text,
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists social_links jsonb not null default '{}'::jsonb,
  add column if not exists languages text[] not null default '{en}',
  add column if not exists policies jsonb not null default '{}'::jsonb,
  add column if not exists status text not null default 'draft',
  add column if not exists owner_id uuid,
  add column if not exists updated_at timestamptz not null default now();

alter table public.libraries
  drop constraint if exists libraries_status_check;

alter table public.libraries
  add constraint libraries_status_check
  check (status in ('draft', 'pending_approval', 'active', 'suspended', 'rejected', 'archived'));

alter table public.libraries
  alter column slug set not null,
  alter column owner_id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'libraries_owner_id_fkey'
  ) then
    alter table public.libraries
      add constraint libraries_owner_id_fkey
      foreign key (owner_id) references auth.users (id) on delete restrict;
  end if;
end $$;

create unique index if not exists libraries_slug_unique_idx
on public.libraries (slug);

create index if not exists libraries_status_idx
on public.libraries (status);

create index if not exists libraries_owner_id_idx
on public.libraries (owner_id);

drop trigger if exists handle_libraries_updated_at on public.libraries;
create trigger handle_libraries_updated_at
before update on public.libraries
for each row
execute function extensions.moddatetime('updated_at');

alter table public.libraries enable row level security;

drop policy if exists "Authenticated users can read libraries" on public.libraries;
drop policy if exists "Active libraries are publicly readable" on public.libraries;
create policy "Active libraries are publicly readable"
on public.libraries
for select
to public
using (status = 'active');

drop policy if exists "Library managers can read private libraries" on public.libraries;
create policy "Library managers can read private libraries"
on public.libraries
for select
to authenticated
using (
  owner_id = auth.uid()
  or public.authorize_library('library_staff', id)
  or public.authorize('admin')
  or public.authorize('superadmin')
);

drop policy if exists "Authenticated users can create libraries" on public.libraries;
create policy "Authenticated users can create libraries"
on public.libraries
for insert
to authenticated
with check (
  auth.uid() is not null
  and owner_id = auth.uid()
);

drop policy if exists "Library managers can update libraries" on public.libraries;
create policy "Library managers can update libraries"
on public.libraries
for update
to authenticated
using (
  owner_id = auth.uid()
  or public.authorize_library('library_staff', id)
  or public.authorize('admin')
  or public.authorize('superadmin')
)
with check (
  owner_id = auth.uid()
  or public.authorize_library('library_staff', id)
  or public.authorize('admin')
  or public.authorize('superadmin')
);

drop policy if exists "Only superadmins can delete libraries" on public.libraries;
create policy "Only superadmins can delete libraries"
on public.libraries
for delete
to authenticated
using (public.authorize('superadmin'));
