grant usage on schema public to anon, authenticated, service_role;

do $$
begin
  if exists (
    select 1
    from pg_tables
    where schemaname = 'public'
      and tablename = 'libraries'
  ) then
    grant select, insert, update, delete on table public.libraries
    to anon, authenticated, service_role;
  end if;

  if exists (
    select 1
    from pg_tables
    where schemaname = 'public'
      and tablename = 'library_status_history'
  ) then
    grant select, insert on table public.library_status_history
    to anon, authenticated, service_role;
  end if;

  if exists (
    select 1
    from pg_tables
    where schemaname = 'public'
      and tablename = 'library_staff_memberships'
  ) then
    grant select, insert, update, delete on table public.library_staff_memberships
    to anon, authenticated, service_role;
  end if;

  if exists (
    select 1
    from pg_tables
    where schemaname = 'public'
      and tablename = 'library_settings'
  ) then
    grant select, insert, update, delete on table public.library_settings
    to anon, authenticated, service_role;
  end if;
end $$;

notify pgrst, 'reload schema';
