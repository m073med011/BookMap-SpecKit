create table if not exists public.app_roles (
  id text primary key,
  description text not null
);

alter table public.app_roles enable row level security;

insert into public.app_roles (id, description)
values
  ('user', 'Registered platform user'),
  ('library_staff', 'Staff member of a library'),
  ('admin', 'Platform administrator'),
  ('superadmin', 'Full platform governance')
on conflict (id) do update
set description = excluded.description;
