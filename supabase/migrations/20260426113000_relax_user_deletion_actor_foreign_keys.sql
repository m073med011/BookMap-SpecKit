alter table public.audit_logs
  drop constraint if exists audit_logs_user_id_fkey;

alter table public.audit_logs
  add constraint audit_logs_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete set null;

alter table public.user_roles
  drop constraint if exists user_roles_assigned_by_fkey;

alter table public.user_roles
  add constraint user_roles_assigned_by_fkey
  foreign key (assigned_by) references auth.users (id) on delete set null;

alter table public.staff_invitations
  alter column invited_by drop not null;

alter table public.staff_invitations
  drop constraint if exists staff_invitations_invited_by_fkey;

alter table public.staff_invitations
  add constraint staff_invitations_invited_by_fkey
  foreign key (invited_by) references auth.users (id) on delete set null;

alter table public.library_status_history
  alter column changed_by drop not null;

alter table public.library_status_history
  drop constraint if exists library_status_history_changed_by_fkey;

alter table public.library_status_history
  add constraint library_status_history_changed_by_fkey
  foreign key (changed_by) references auth.users (id) on delete set null;
