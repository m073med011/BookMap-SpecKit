create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  claims jsonb;
  user_roles_data jsonb;
begin
  claims := coalesce(event->'claims', '{}'::jsonb);

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'role', ur.role,
        'library_id', ur.library_id
      )
    ),
    '[]'::jsonb
  )
  into user_roles_data
  from public.user_roles ur
  where ur.user_id = (event->>'user_id')::uuid;

  claims := jsonb_set(
    claims,
    '{app_metadata,roles}',
    user_roles_data,
    true
  );

  event := jsonb_set(event, '{claims}', claims, true);

  return event;
end;
$$;

grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from public;
revoke execute on function public.custom_access_token_hook(jsonb) from anon;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated;
