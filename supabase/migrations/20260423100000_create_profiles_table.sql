create extension if not exists pgcrypto with schema extensions;
create extension if not exists moddatetime with schema extensions;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'New User' check (char_length(display_name) <= 100),
  bio text null check (bio is null or char_length(bio) <= 500),
  preferred_locale text not null default 'en' check (preferred_locale in ('en', 'ar')),
  avatar_url text null,
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists handle_profiles_updated_at on public.profiles;
create trigger handle_profiles_updated_at
before update on public.profiles
for each row
execute function extensions.moddatetime('updated_at');

alter table public.profiles enable row level security;
