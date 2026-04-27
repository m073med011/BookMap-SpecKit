create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null references public.app_roles (id),
  library_id uuid null,
  assigned_by uuid null references auth.users (id),
  assigned_at timestamptz not null default now(),
  check (
    (role = 'library_staff' and library_id is not null)
    or (role != 'library_staff' and library_id is null)
  )
);

create unique index if not exists user_roles_unique_assignment_idx
  on public.user_roles (
    user_id,
    role,
    coalesce(library_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

create index if not exists user_roles_user_id_idx
  on public.user_roles (user_id);

create index if not exists user_roles_library_role_idx
  on public.user_roles (library_id, role);

alter table public.user_roles enable row level security;
