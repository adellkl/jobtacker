-- Schéma Supabase pour l'app Job Tracker
-- A exécuter dans SQL Editor Supabase (onglet SQL)

create extension if not exists pgcrypto;

-- Profils utilisateur (optionnel pour métadonnées supplémentaires)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Candidatures utilisateur
create table if not exists public.applications (
  id text primary key, -- on garde l'id client pour simplifier la synchro
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id text,
  job_data jsonb not null default '{}'::jsonb,
  status text not null default 'applied',
  notes text,
  applied_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Offres sauvegardées (favoris)
create table if not exists public.saved_jobs (
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id text not null,
  job_data jsonb not null default '{}'::jsonb,
  saved_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

-- Fonction et trigger pour updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_applications_updated_at on public.applications;
create trigger trg_applications_updated_at
before update on public.applications
for each row execute function public.set_updated_at();

-- Notifications utilisateur
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'info',
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_notifications_unread on public.notifications(user_id, read_at);


-- Alertes utilisateur (requêtes sauvegardées)
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query text,
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  last_run_at timestamptz,
  last_results_count integer not null default 0
);

create index if not exists idx_alerts_user on public.alerts(user_id);


