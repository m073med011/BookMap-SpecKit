create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    )
  );

  insert into public.user_roles (user_id, role)
  values (new.id, 'user');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create or replace function public.authorize(required_role text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  jwt_roles jsonb := coalesce(
    (
      select auth.jwt()->'app_metadata'->'roles'
    ),
    '[]'::jsonb
  );
begin
  return exists (
    select 1
    from jsonb_array_elements(jwt_roles) as role_entry
    where role_entry->>'role' = required_role
  );
end;
$$;

create or replace function public.authorize_library(required_role text, lib_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  jwt_roles jsonb := coalesce(
    (
      select auth.jwt()->'app_metadata'->'roles'
    ),
    '[]'::jsonb
  );
begin
  return exists (
    select 1
    from jsonb_array_elements(jwt_roles) as role_entry
    where role_entry->>'role' = required_role
      and (role_entry->>'library_id')::uuid = lib_id
  );
end;
$$;
