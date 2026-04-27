create table if not exists public.libraries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.libraries enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_roles_library_id_fkey'
  ) then
    alter table public.user_roles
      add constraint user_roles_library_id_fkey
      foreign key (library_id) references public.libraries (id) on delete cascade;
  end if;
end $$;
