create table if not exists public.staff_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  library_id uuid not null references public.libraries (id) on delete cascade,
  invited_by uuid not null references auth.users (id),
  token text not null unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired', 'revoked')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists staff_invitations_token_idx
  on public.staff_invitations (token);

create index if not exists staff_invitations_email_library_status_idx
  on public.staff_invitations (email, library_id, status);

create index if not exists staff_invitations_expires_at_idx
  on public.staff_invitations (expires_at);

alter table public.staff_invitations enable row level security;
