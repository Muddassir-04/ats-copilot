-- ATS Copilot — Phase 1 schema: profiles, master_profiles, tailored_documents, applications.
-- Run this in the Supabase SQL editor (or via `supabase db push`).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  free_tailors_used int not null default 0,
  razorpay_customer_id text,
  razorpay_subscription_id text,
  subscription_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = id);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- master_profiles (1:1 with user — the "enter once" source of truth)
-- ---------------------------------------------------------------------------
create table public.master_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  full_name text,
  email text,
  phone text,
  location text,
  linkedin_url text,
  headline text,
  summary text,
  nationality text,
  visa_status text,
  availability text,
  photo_url text,
  experiences jsonb not null default '[]',
  education jsonb not null default '[]',
  skills jsonb not null default '[]',
  certifications jsonb not null default '[]',
  languages jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.master_profiles enable row level security;

create policy "master_profiles_select_own" on public.master_profiles
  for select using (auth.uid() = user_id);
create policy "master_profiles_insert_own" on public.master_profiles
  for insert with check (auth.uid() = user_id);
create policy "master_profiles_update_own" on public.master_profiles
  for update using (auth.uid() = user_id);
create policy "master_profiles_delete_own" on public.master_profiles
  for delete using (auth.uid() = user_id);

create trigger master_profiles_set_updated_at
  before update on public.master_profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- tailored_documents (each JD → CV output)
-- ---------------------------------------------------------------------------
create table public.tailored_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  jd_text text not null,
  target_role text,
  target_company text,
  gulf_format boolean not null default false,
  ats_score int check (ats_score between 0 and 100),
  ats_analysis jsonb,
  tailored_cv jsonb,
  cv_schema_version int not null default 1,
  cover_letter text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tailored_documents enable row level security;

create policy "tailored_documents_select_own" on public.tailored_documents
  for select using (auth.uid() = user_id);
create policy "tailored_documents_insert_own" on public.tailored_documents
  for insert with check (auth.uid() = user_id);
create policy "tailored_documents_update_own" on public.tailored_documents
  for update using (auth.uid() = user_id);
create policy "tailored_documents_delete_own" on public.tailored_documents
  for delete using (auth.uid() = user_id);

create trigger tailored_documents_set_updated_at
  before update on public.tailored_documents
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- applications (the tracker)
-- ---------------------------------------------------------------------------
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  document_id uuid references public.tailored_documents (id) on delete set null,
  company text not null,
  role text not null,
  status text not null default 'saved'
    check (status in ('saved', 'applied', 'interviewing', 'offer', 'rejected')),
  applied_at date,
  follow_up_at date,
  source text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.applications enable row level security;

create policy "applications_select_own" on public.applications
  for select using (auth.uid() = user_id);
create policy "applications_insert_own" on public.applications
  for insert with check (auth.uid() = user_id);
create policy "applications_update_own" on public.applications
  for update using (auth.uid() = user_id);
create policy "applications_delete_own" on public.applications
  for delete using (auth.uid() = user_id);

create trigger applications_set_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();
