create table if not exists public.library_settings (
  id uuid primary key default gen_random_uuid(),
  library_id uuid not null unique references public.libraries (id) on delete cascade,
  shipping_preferences jsonb not null default '{}'::jsonb,
  return_policy text,
  operating_hours jsonb not null default '{}'::jsonb,
  custom_settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create unique index if not exists library_settings_library_id_unique_idx
on public.library_settings (library_id);

drop trigger if exists handle_library_settings_updated_at on public.library_settings;
create trigger handle_library_settings_updated_at
before update on public.library_settings
for each row
execute function extensions.moddatetime('updated_at');

alter table public.library_settings enable row level security;

drop policy if exists "Library settings are visible to managers" on public.library_settings;
create policy "Library settings are visible to managers"
on public.library_settings
for select
to authenticated
using (
  exists (
    select 1
    from public.library_staff_memberships as memberships
    where memberships.library_id = library_settings.library_id
      and memberships.user_id = auth.uid()
  )
  or public.authorize('admin')
  or public.authorize('superadmin')
);

drop policy if exists "Library owners can create settings" on public.library_settings;
create policy "Library owners can create settings"
on public.library_settings
for insert
to authenticated
with check (
  exists (
    select 1
    from public.library_staff_memberships as memberships
    where memberships.library_id = library_settings.library_id
      and memberships.user_id = auth.uid()
      and memberships.library_role = 'owner'
  )
  or public.authorize('admin')
  or public.authorize('superadmin')
);

drop policy if exists "Library owners can update settings" on public.library_settings;
create policy "Library owners can update settings"
on public.library_settings
for update
to authenticated
using (
  exists (
    select 1
    from public.library_staff_memberships as memberships
    where memberships.library_id = library_settings.library_id
      and memberships.user_id = auth.uid()
      and memberships.library_role = 'owner'
  )
  or public.authorize('admin')
  or public.authorize('superadmin')
)
with check (
  exists (
    select 1
    from public.library_staff_memberships as memberships
    where memberships.library_id = library_settings.library_id
      and memberships.user_id = auth.uid()
      and memberships.library_role = 'owner'
  )
  or public.authorize('admin')
  or public.authorize('superadmin')
);
