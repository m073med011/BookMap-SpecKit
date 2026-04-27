create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users (id),
  action text not null,
  target_type text null,
  target_id text null,
  metadata jsonb not null default '{}'::jsonb,
  ip_address inet null,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_user_created_at_idx
  on public.audit_logs (user_id, created_at desc);

create index if not exists audit_logs_action_created_at_idx
  on public.audit_logs (action, created_at desc);

create index if not exists audit_logs_created_at_idx
  on public.audit_logs (created_at);

alter table public.audit_logs enable row level security;
