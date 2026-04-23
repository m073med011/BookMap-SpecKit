-- Usage: SUPERADMIN_EMAIL=admin@example.com pnpm supabase db seed
-- If your seed runner does not expose SUPERADMIN_EMAIL as a psql variable,
-- replace the fallback value below before running the seed.
\if :{?SUPERADMIN_EMAIL}
  \set superadmin_email :'SUPERADMIN_EMAIL'
\else
  \set superadmin_email 'admin@example.com'
\endif

do $$
declare
  target_email text := :'superadmin_email';
  target_user_id uuid;
  superadmin_exists boolean;
begin
  select exists (
    select 1
    from public.user_roles
    where role = 'superadmin'
  )
  into superadmin_exists;

  if superadmin_exists then
    raise notice 'A superadmin already exists. No bootstrap changes were applied.';
    return;
  end if;

  select id
  into target_user_id
  from auth.users
  where email = target_email
  limit 1;

  if target_user_id is null then
    raise notice 'No user with email % exists yet. Register that account first, then re-run this seed.', target_email;
    return;
  end if;

  if not exists (
    select 1
    from public.user_roles
    where user_id = target_user_id
      and role = 'superadmin'
  ) then
    insert into public.user_roles (user_id, role)
    values (target_user_id, 'superadmin');
  end if;

  raise notice 'Superadmin bootstrap completed for %.', target_email;
end;
$$;
