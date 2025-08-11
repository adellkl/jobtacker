-- Activer RLS et créer des policies

alter table public.profiles enable row level security;
alter table public.applications enable row level security;
alter table public.saved_jobs enable row level security;

-- Idempotence: supprimer avant de créer
drop policy if exists "Read own profile" on public.profiles;
drop policy if exists "Upsert own profile" on public.profiles;
drop policy if exists "Update own profile" on public.profiles;

create policy "Read own profile" on public.profiles
  for select using (auth.uid() = user_id);
create policy "Upsert own profile" on public.profiles
  for insert with check (auth.uid() = user_id);
create policy "Update own profile" on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Idempotence
drop policy if exists "Read own applications" on public.applications;
drop policy if exists "Insert own applications" on public.applications;
drop policy if exists "Update own applications" on public.applications;
drop policy if exists "Delete own applications" on public.applications;

create policy "Read own applications" on public.applications
  for select using (auth.uid() = user_id);
create policy "Insert own applications" on public.applications
  for insert with check (auth.uid() = user_id);
create policy "Update own applications" on public.applications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Delete own applications" on public.applications
  for delete using (auth.uid() = user_id);

-- Idempotence
drop policy if exists "Read own saved jobs" on public.saved_jobs;
drop policy if exists "Upsert own saved jobs" on public.saved_jobs;
drop policy if exists "Delete own saved jobs" on public.saved_jobs;

-- Notifications
alter table public.notifications enable row level security;
drop policy if exists "Read own notifications" on public.notifications;
drop policy if exists "Insert own notifications" on public.notifications;
drop policy if exists "Update own notifications" on public.notifications;
create policy "Read own notifications" on public.notifications
  for select using (auth.uid() = user_id);
create policy "Insert own notifications" on public.notifications
  for insert with check (auth.uid() = user_id);
create policy "Update own notifications" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Read own saved jobs" on public.saved_jobs
  for select using (auth.uid() = user_id);
create policy "Upsert own saved jobs" on public.saved_jobs
  for insert with check (auth.uid() = user_id);
create policy "Delete own saved jobs" on public.saved_jobs
  for delete using (auth.uid() = user_id);


