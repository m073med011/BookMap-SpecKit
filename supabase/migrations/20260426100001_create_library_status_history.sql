create table if not exists public.library_status_history (
  id uuid primary key default gen_random_uuid(),
  library_id uuid not null references public.libraries (id) on delete cascade,
  previous_status text,
  new_status text not null,
  reason text,
  changed_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists library_status_history_library_id_idx
on public.library_status_history (library_id);

create index if not exists library_status_history_created_at_idx
on public.library_status_history (created_at desc);

alter table public.library_status_history enable row level security;

drop policy if exists "Library status history is visible to managers" on public.library_status_history;
create policy "Library status history is visible to managers"
on public.library_status_history
for select
to authenticated
using (
  exists (
    select 1
    from public.libraries
    where libraries.id = library_status_history.library_id
      and (
        libraries.owner_id = auth.uid()
        or public.authorize_library('library_staff', libraries.id)
        or public.authorize('admin')
        or public.authorize('superadmin')
      )
  )
);

drop policy if exists "Library status history is not directly insertable" on public.library_status_history;
create policy "Library status history is not directly insertable"
on public.library_status_history
for insert
to authenticated
with check (false);

create or replace function public.record_library_status_change(
  p_library_id uuid,
  p_previous_status text,
  p_new_status text,
  p_reason text,
  p_changed_by uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.library_status_history (
    library_id,
    previous_status,
    new_status,
    reason,
    changed_by
  )
  values (
    p_library_id,
    p_previous_status,
    p_new_status,
    p_reason,
    p_changed_by
  );
end;
$$;

grant execute on function public.record_library_status_change(uuid, text, text, text, uuid)
to authenticated, service_role;
