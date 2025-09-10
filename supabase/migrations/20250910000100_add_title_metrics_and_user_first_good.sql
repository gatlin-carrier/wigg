-- Title-level aggregated metrics
create table if not exists public.title_metrics (
  title_id text primary key,
  t2g_comm_pct numeric,
  t2g_comm_iqr numeric,
  peak_label text,
  peak_at_pct numeric,
  sample_size integer,
  updated_at timestamptz default now()
);

alter table public.title_metrics enable row level security;

-- Public can read aggregated metrics (drop-and-create for idempotency)
drop policy if exists title_metrics_read on public.title_metrics;
create policy title_metrics_read on public.title_metrics
  for select using (true);

-- Per-user first-good snapshots (for fast aggregation)
create table if not exists public.user_first_good (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title_id text not null,
  first_good_pct numeric not null check (first_good_pct >= 0 and first_good_pct <= 100),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, title_id)
);

alter table public.user_first_good enable row level security;

-- Users can see and write their own rows (drop-and-create for idempotency)
drop policy if exists user_first_good_select on public.user_first_good;
create policy user_first_good_select on public.user_first_good
  for select using (auth.uid() = user_id);

drop policy if exists user_first_good_insert on public.user_first_good;
create policy user_first_good_insert on public.user_first_good
  for insert with check (auth.uid() = user_id);

drop policy if exists user_first_good_update on public.user_first_good;
create policy user_first_good_update on public.user_first_good
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Helper view to support median/iqr (optional)
-- You can compute median/iqr in edge function to avoid SQL extensions.
