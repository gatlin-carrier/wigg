-- Fix security issues from the linter

-- 1. Enable RLS on public tables that were missed
alter table public.media enable row level security;
alter table public.episodes enable row level security;

-- 2. Add RLS policies for media and episodes (public read access for discovery)
create policy "media_public_read" on public.media
  for select using (true);

create policy "episodes_public_read" on public.episodes
  for select using (true);

-- 3. Fix function search paths
create or replace function public.upsert_media(
  in p_type public.media_type,
  in p_title text,
  in p_year int,
  in p_duration_sec int default null,
  in p_pages int default null,
  in p_external_ids jsonb default '{}'::jsonb
) returns uuid 
language plpgsql 
security definer
set search_path = public
as $$
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
) returns uuid 
language plpgsql 
security definer
set search_path = public
as $$
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