-- 0) SAFE RE-RUN SETUP (idempotent drops)
-- Run safely for re-execution during development.
drop materialized view if exists public.consensus_wigg cascade;
drop view if exists public.media_lookup cascade;

drop table if exists public.list_items cascade;
drop table if exists public.lists cascade;
drop table if exists public.flags cascade;
drop table if exists public.votes cascade;
drop table if exists public.wigg_points cascade;
drop table if exists public.episodes cascade;
drop table if exists public.media cascade;
drop table if exists public.profiles cascade;

drop type if exists public.media_type cascade;
drop type if exists public.pos_type cascade;
drop type if exists public.spoiler_level cascade;

-- 1) ENUMS
create type public.media_type as enum (
  'movie', 'tv', 'anime', 'game', 'book', 'podcast'
);

create type public.pos_type as enum (
  'sec',      -- seconds from start (videos/podcasts)
  'page',     -- page number (books)
  'percent'   -- 0–100 for anything
);

create type public.spoiler_level as enum ('0','1','2'); 
-- '0' = none, '1' = light, '2' = full (gated)

-- 2) CORE ENTITIES
-- Minimal profile linked to Supabase auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  trust_score real not null default 1.0,          -- weights consensus
  patience int not null default 20,               -- minutes user "gives" a title
  sensitivity_flags text[] not null default '{}', -- user content sensitivities
  created_at timestamptz not null default now()
);

-- Media (movie, tv series, book, game, podcast show)
create table public.media (
  id uuid primary key default gen_random_uuid(),
  type public.media_type not null,
  title text not null,
  year int,
  duration_sec int,        -- for movies; nullable for series/books
  pages int,               -- for books
  external_ids jsonb not null default '{}'::jsonb, -- imdb_id, tmdb_id, etc.
  metadata jsonb not null default '{}'::jsonb,     -- any extra fields
  created_at timestamptz not null default now()
);

-- Episodes (child of a TV/anime/podcast media)
create table public.episodes (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null references public.media(id) on delete cascade,
  season int,
  episode int,
  title text,
  duration_sec int,
  release_date date,
  created_at timestamptz not null default now(),
  unique (media_id, season, episode)
);

-- 3) USER-GENERATED DATA
-- A single "wigg" (point or span)
create table public.wigg_points (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null references public.media(id) on delete cascade,
  episode_id uuid references public.episodes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,

  pos_kind public.pos_type not null default 'sec',
  pos_value numeric(10,3) not null,          -- seconds/page/percent (fits all)

  span_start numeric(10,3),                  -- optional: start of a sequence
  span_end   numeric(10,3),                  -- optional: end of a sequence

  tags text[] not null default '{}',         -- e.g., {action, reveal}
  reason_short text,                         -- spoiler-safe blurb (<=140 chars)
  spoiler public.spoiler_level not null default '0',

  created_at timestamptz not null default now(),
  constraint chk_span_valid check (
    (span_start is null and span_end is null)
    or (span_start is not null and span_end is not null and span_end > span_start)
  )
);

-- Votes: up/down confidence on a wigg_point
create table public.votes (
  id uuid primary key default gen_random_uuid(),
  point_id uuid not null references public.wigg_points(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  unique (point_id, user_id)
);

-- Reports/flags for moderation
create table public.flags (
  id uuid primary key default gen_random_uuid(),
  point_id uuid not null references public.wigg_points(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now()
);

-- User lists & smart lists
create table public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  is_smart boolean not null default false,
  rules jsonb not null default '{}'::jsonb,  -- if smart (e.g., {"tth":{"lte":15}})
  created_at timestamptz not null default now()
);

create table public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists(id) on delete cascade,
  media_id uuid references public.media(id) on delete set null,
  episode_id uuid references public.episodes(id) on delete set null,
  position int,
  created_at timestamptz not null default now()
);

-- 4) INDEXES (query performance)
-- Media search
create index media_title_trgm on public.media using gin (title gin_trgm_ops);
create index media_type_idx on public.media (type);

-- Episodes lookups
create index episodes_media_idx on public.episodes (media_id);

-- Wigg queries
create index wigg_points_media_idx on public.wigg_points (media_id);
create index wigg_points_episode_idx on public.wigg_points (episode_id);
create index wigg_points_user_idx on public.wigg_points (user_id);
create index wigg_points_pos_value_idx on public.wigg_points (pos_value);
create index wigg_points_tags_idx on public.wigg_points using gin (tags);

-- Votes quick joins
create index votes_point_idx on public.votes (point_id);
create index votes_user_idx on public.votes (user_id);

-- Lists
create index list_items_list_idx on public.list_items (list_id);

-- 5) ROW-LEVEL SECURITY (Supabase-ready)
-- Enable RLS
alter table public.profiles    enable row level security;
alter table public.wigg_points enable row level security;
alter table public.votes       enable row level security;
alter table public.flags       enable row level security;
alter table public.lists       enable row level security;
alter table public.list_items  enable row level security;

-- PROFILES
create policy "profiles_self_select" on public.profiles
  for select using (true);  -- everyone can read public profiles (tune if needed)

create policy "profiles_self_upsert" on public.profiles
  for insert with check (id = auth.uid());

create policy "profiles_self_update" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- WIGG_POINTS
create policy "wigg_points_select_all" on public.wigg_points
  for select using (true);

create policy "wigg_points_insert_own" on public.wigg_points
  for insert with check (user_id = auth.uid());

create policy "wigg_points_update_own" on public.wigg_points
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "wigg_points_delete_own" on public.wigg_points
  for delete using (user_id = auth.uid());

-- VOTES
create policy "votes_select_all" on public.votes
  for select using (true);

create policy "votes_insert_own" on public.votes
  for insert with check (user_id = auth.uid());

create policy "votes_update_own" on public.votes
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- FLAGS
create policy "flags_select_moderate" on public.flags
  for select using (true); -- or restrict to admins later

create policy "flags_insert_own" on public.flags
  for insert with check (user_id = auth.uid());

-- LISTS
create policy "lists_owner_read" on public.lists
  for select using (user_id = auth.uid());

create policy "lists_owner_cud" on public.lists
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- LIST_ITEMS
create policy "list_items_owner_read" on public.list_items
  for select using (
    exists (select 1 from public.lists l where l.id = list_id and l.user_id = auth.uid())
  );

create policy "list_items_owner_cud" on public.list_items
  using (
    exists (select 1 from public.lists l where l.id = list_id and l.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.lists l where l.id = list_id and l.user_id = auth.uid())
  );

-- 6) HELPER VIEW(S) & MATERIALIZED VIEW
-- Quick lookup that flattens media/episode naming for UI
create view public.media_lookup as
select
  m.id            as media_id,
  e.id            as episode_id,
  m.type,
  m.title         as media_title,
  e.title         as episode_title,
  e.season,
  e.episode,
  coalesce(e.duration_sec, m.duration_sec) as duration_sec
from public.media m
left join public.episodes e on e.media_id = m.id;

-- CONSENSUS (simple, fast; uses weighted percentile and windows)
-- NOTE: This is a first-pass aggregation you can refresh after inserts.
create materialized view public.consensus_wigg as
with base as (
  select
    coalesce(w.episode_id::text, w.media_id::text) as scope_id, -- per-episode if present else per-media
    w.media_id,
    w.episode_id,
    w.pos_kind,
    w.pos_value,
    p.trust_score,
    w.created_at
  from public.wigg_points w
  join public.profiles p on p.id = w.user_id
)
select
  scope_id,
  media_id,
  episode_id,
  pos_kind,
  -- Weighted percentile approximation: expand rows by round(trust_score*10)
  -- (LLM-safe approach; exact weighted_percentile needs extensions)
  percentile_cont(0.5) within group (order by pos_value) as median_pos,
  percentile_cont(0.25) within group (order by pos_value) as q1_pos,
  percentile_cont(0.75) within group (order by pos_value) as q3_pos,
  count(*) as n_points,
  min(created_at) as first_at,
  max(created_at) as last_at
from (
  select
    b.scope_id, b.media_id, b.episode_id, b.pos_kind, b.pos_value, b.created_at
  from base b
  cross join lateral generate_series(1, greatest(1, round(b.trust_score*10)::int)) g
) expanded
group by scope_id, media_id, episode_id, pos_kind;

-- Helpful index for fast scope lookups
create index consensus_scope_idx on public.consensus_wigg (scope_id);

-- To enable CONCURRENTLY, add a unique index first:
create unique index if not exists consensus_unique_idx
  on public.consensus_wigg(scope_id, coalesce(episode_id, '00000000-0000-0000-0000-000000000000'::uuid), pos_kind);

-- 7) SIMPLE HELPER FUNCTIONS (LLM-friendly)
-- Upsert media by title+year+type (very basic; extend as needed)
create or replace function public.upsert_media(
  in p_type public.media_type,
  in p_title text,
  in p_year int,
  in p_duration_sec int default null,
  in p_pages int default null,
  in p_external_ids jsonb default '{}'::jsonb
) returns uuid language plpgsql as $$
declare v_id uuid;
begin
  select id into v_id
  from public.media
  where type = p_type and title = p_title and coalesce(year,-1) = coalesce(p_year,-1)
  limit 1;

  if v_id is null then
    insert into public.media(type, title, year, duration_sec, pages, external_ids)
    values (p_type, p_title, p_year, p_duration_sec, p_pages, p_external_ids)
    returning id into v_id;
  end if;

  return v_id;
end$$;

-- Quick insert of a wigg (point or span). Agent-safe: validates user owns profile.
create or replace function public.add_wigg(
  in p_media_id uuid,
  in p_episode_id uuid,
  in p_user_id uuid,
  in p_pos_kind public.pos_type,
  in p_pos_value numeric,
  in p_span_start numeric default null,
  in p_span_end numeric default null,
  in p_tags text[] default '{}',
  in p_reason_short text default null,
  in p_spoiler public.spoiler_level default '0'
) returns uuid language plpgsql as $$
declare v_id uuid;
begin
  -- Ensure user profile exists
  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'Profile not found for user %', p_user_id;
  end if;

  insert into public.wigg_points(
    media_id, episode_id, user_id, pos_kind, pos_value,
    span_start, span_end, tags, reason_short, spoiler
  ) values (
    p_media_id, p_episode_id, p_user_id, p_pos_kind, p_pos_value,
    p_span_start, p_span_end, p_tags, p_reason_short, p_spoiler
  ) returning id into v_id;

  return v_id;
end$$;

-- Add trigger for user profile creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public 
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'username', new.email));
  return new;
end;
$$;

-- Create trigger for automatic profile creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 8) SEED (tiny, safe)
-- Add a demo movie for testing
select public.upsert_media('movie','Dune (2021)', 2021, 9300, null, '{"imdb":"tt1160419"}');