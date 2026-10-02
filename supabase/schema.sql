-- ==============================================================================
-- DayFlow Supabase Database Schema & Row Level Security (RLS) Policies
-- Run this script in your Supabase Project's SQL Editor to set up the tables.
-- ==============================================================================

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text not null default '',
  role text default 'Student / Developer',
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can delete their own profile"
  on public.profiles for delete
  using (auth.uid() = id);

-- Trigger to create public.profiles row automatically upon auth.users signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'Student / Developer'),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(excluded.full_name, ''), profiles.full_name),
    role = coalesce(nullif(excluded.role, ''), profiles.role),
    updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. TASKS TABLE
create table if not exists public.tasks (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  date text not null, -- YYYY-MM-DD
  time text not null, -- e.g. "04:00 PM"
  category text not null,
  priority text not null,
  completed boolean not null default false,
  completed_at timestamp with time zone,
  repeat text not null default 'Never',
  is_focus boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.tasks enable row level security;

create policy "Users can select own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tasks"
  on public.tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

create index if not exists tasks_user_date_idx on public.tasks (user_id, date);

-- 3. ROUTINES TABLE
create table if not exists public.routines (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  time text not null,
  category text not null,
  priority text not null,
  repeat_days integer[] not null default '{0,1,2,3,4,5,6}',
  enabled boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.routines enable row level security;

create policy "Users can select own routines"
  on public.routines for select
  using (auth.uid() = user_id);

create policy "Users can insert own routines"
  on public.routines for insert
  with check (auth.uid() = user_id);

create policy "Users can update own routines"
  on public.routines for update
  using (auth.uid() = user_id);

create policy "Users can delete own routines"
  on public.routines for delete
  using (auth.uid() = user_id);

create index if not exists routines_user_idx on public.routines (user_id);

-- 4. ROUTINE COMPLETIONS TABLE
create table if not exists public.routine_completions (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  routine_id text not null,
  date text not null, -- YYYY-MM-DD
  completed boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, routine_id, date)
);

alter table public.routine_completions enable row level security;

create policy "Users can select own routine completions"
  on public.routine_completions for select
  using (auth.uid() = user_id);

create policy "Users can insert own routine completions"
  on public.routine_completions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own routine completions"
  on public.routine_completions for update
  using (auth.uid() = user_id);

create policy "Users can delete own routine completions"
  on public.routine_completions for delete
  using (auth.uid() = user_id);

create index if not exists completions_user_date_idx on public.routine_completions (user_id, date);
