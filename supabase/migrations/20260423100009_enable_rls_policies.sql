drop policy if exists "Authenticated users can read profiles" on public.profiles;
create policy "Authenticated users can read profiles"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Authenticated users can read app roles" on public.app_roles;
create policy "Authenticated users can read app roles"
on public.app_roles
for select
to authenticated
using (true);

drop policy if exists "Users can read their roles and admins can read all roles" on public.user_roles;
create policy "Users can read their roles and admins can read all roles"
on public.user_roles
for select
to authenticated
using (
  auth.uid() = user_id
  or public.authorize('admin')
  or public.authorize('superadmin')
);

drop policy if exists "Only superadmins can insert roles" on public.user_roles;
create policy "Only superadmins can insert roles"
on public.user_roles
for insert
to authenticated
with check (public.authorize('superadmin'));

drop policy if exists "Only superadmins can delete roles" on public.user_roles;
create policy "Only superadmins can delete roles"
on public.user_roles
for delete
to authenticated
using (public.authorize('superadmin'));

drop policy if exists "Authenticated users can read libraries" on public.libraries;
create policy "Authenticated users can read libraries"
on public.libraries
for select
to authenticated
using (true);

drop policy if exists "Inviters admins and superadmins can read invitations" on public.staff_invitations;
create policy "Inviters admins and superadmins can read invitations"
on public.staff_invitations
for select
to authenticated
using (
  auth.uid() = invited_by
  or public.authorize('admin')
  or public.authorize('superadmin')
);

drop policy if exists "Admins and superadmins can create invitations" on public.staff_invitations;
create policy "Admins and superadmins can create invitations"
on public.staff_invitations
for insert
to authenticated
with check (
  public.authorize('admin')
  or public.authorize('superadmin')
);

drop policy if exists "Only superadmins can read audit logs" on public.audit_logs;
create policy "Only superadmins can read audit logs"
on public.audit_logs
for select
to authenticated
using (public.authorize('superadmin'));
