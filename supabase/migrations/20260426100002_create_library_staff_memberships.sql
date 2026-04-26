create table if not exists public.library_staff_memberships (
  id uuid primary key default gen_random_uuid(),
  library_id uuid not null references public.libraries (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  library_role text not null check (library_role in ('owner', 'staff')),
  assigned_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists library_staff_memberships_unique_idx
on public.library_staff_memberships (library_id, user_id);

create index if not exists library_staff_memberships_user_id_idx
on public.library_staff_memberships (user_id);

alter table public.library_staff_memberships enable row level security;

drop policy if exists "Library members can read memberships" on public.library_staff_memberships;
create policy "Library members can read memberships"
on public.library_staff_memberships
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.library_staff_memberships as memberships
    where memberships.library_id = library_staff_memberships.library_id
      and memberships.user_id = auth.uid()
  )
  or public.authorize('admin')
  or public.authorize('superadmin')
);

drop policy if exists "Library owners can create memberships" on public.library_staff_memberships;
create policy "Library owners can create memberships"
on public.library_staff_memberships
for insert
to authenticated
with check (
  public.authorize('admin')
  or public.authorize('superadmin')
  or exists (
    select 1
    from public.library_staff_memberships as memberships
    where memberships.library_id = library_staff_memberships.library_id
      and memberships.user_id = auth.uid()
      and memberships.library_role = 'owner'
  )
);

drop policy if exists "Library owners can update memberships" on public.library_staff_memberships;
create policy "Library owners can update memberships"
on public.library_staff_memberships
for update
to authenticated
using (
  public.authorize('admin')
  or public.authorize('superadmin')
  or (
    user_id = auth.uid()
    and library_role = 'owner'
  )
  or exists (
    select 1
    from public.library_staff_memberships as memberships
    where memberships.library_id = library_staff_memberships.library_id
      and memberships.user_id = auth.uid()
      and memberships.library_role = 'owner'
  )
)
with check (
  public.authorize('admin')
  or public.authorize('superadmin')
  or (
    user_id = auth.uid()
    and library_role = 'staff'
  )
  or exists (
    select 1
    from public.library_staff_memberships as memberships
    where memberships.library_id = library_staff_memberships.library_id
      and memberships.user_id = auth.uid()
      and memberships.library_role = 'owner'
  )
);

drop policy if exists "Library owners can delete memberships" on public.library_staff_memberships;
create policy "Library owners can delete memberships"
on public.library_staff_memberships
for delete
to authenticated
using (
  public.authorize('admin')
  or public.authorize('superadmin')
  or exists (
    select 1
    from public.library_staff_memberships as memberships
    where memberships.library_id = library_staff_memberships.library_id
      and memberships.user_id = auth.uid()
      and memberships.library_role = 'owner'
  )
);
