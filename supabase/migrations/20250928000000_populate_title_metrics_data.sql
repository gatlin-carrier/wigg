-- Migration to populate title_metrics with real data from existing wigg_points
-- This replaces any empty/placeholder data with calculated community metrics

-- First, populate user_first_good table from existing wigg_points
-- Extract first "good" rating (rating_1, rating_2, or rating_3) for each user per title
INSERT INTO public.user_first_good (user_id, title_id, first_good_pct)
SELECT DISTINCT ON (user_id, media_id)
  user_id,
  media_id as title_id,
  pos_value as first_good_pct
FROM public.wigg_points
WHERE
  pos_kind = 'percent'
  AND (
    'rating_1' = ANY(tags) OR
    'rating_2' = ANY(tags) OR
    'rating_3' = ANY(tags)
  )
ORDER BY user_id, media_id, pos_value ASC
ON CONFLICT (user_id, title_id) DO UPDATE SET
  first_good_pct = EXCLUDED.first_good_pct,
  updated_at = now()
WHERE public.user_first_good.first_good_pct > EXCLUDED.first_good_pct;

-- Now populate title_metrics with aggregated community data
-- Calculate median (approximate) and IQR from user_first_good data
WITH title_stats AS (
  SELECT
    title_id,
    COUNT(*) as sample_size,
    -- Approximate median using percentile_cont
    percentile_cont(0.5) WITHIN GROUP (ORDER BY first_good_pct) as median_pct,
    -- Calculate IQR (75th percentile - 25th percentile)
    percentile_cont(0.75) WITHIN GROUP (ORDER BY first_good_pct) -
    percentile_cont(0.25) WITHIN GROUP (ORDER BY first_good_pct) as iqr_value
  FROM public.user_first_good
  GROUP BY title_id
  HAVING COUNT(*) >= 2  -- Only include titles with at least 2 data points
)
INSERT INTO public.title_metrics (title_id, t2g_comm_pct, t2g_comm_iqr, sample_size, updated_at)
SELECT
  title_id,
  median_pct,
  iqr_value,
  sample_size,
  now()
FROM title_stats
ON CONFLICT (title_id) DO UPDATE SET
  t2g_comm_pct = EXCLUDED.t2g_comm_pct,
  t2g_comm_iqr = EXCLUDED.t2g_comm_iqr,
  sample_size = EXCLUDED.sample_size,
  updated_at = now();

-- Create a function to automatically update user_first_good when wigg_points are added
CREATE OR REPLACE FUNCTION update_user_first_good()
RETURNS TRIGGER AS $$
DECLARE
  has_good_rating BOOLEAN;
  current_first_good NUMERIC;
BEGIN
  -- Check if the new wigg point has a good rating (1, 2, or 3)
  has_good_rating := (
    'rating_1' = ANY(NEW.tags) OR
    'rating_2' = ANY(NEW.tags) OR
    'rating_3' = ANY(NEW.tags)
  );

  -- Only process if it's a percent position and has a good rating
  IF NEW.pos_kind = 'percent' AND has_good_rating AND NEW.pos_value IS NOT NULL THEN
    -- Get current first_good_pct for this user/title combo
    SELECT first_good_pct INTO current_first_good
    FROM public.user_first_good
    WHERE user_id = NEW.user_id AND title_id = NEW.media_id;

    -- Insert or update based on whether this is earlier than existing first good
    INSERT INTO public.user_first_good (user_id, title_id, first_good_pct)
    VALUES (NEW.user_id, NEW.media_id, NEW.pos_value)
    ON CONFLICT (user_id, title_id) DO UPDATE SET
      first_good_pct = LEAST(public.user_first_good.first_good_pct, EXCLUDED.first_good_pct),
      updated_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update user_first_good on wigg_points insert
DROP TRIGGER IF EXISTS trigger_update_user_first_good ON public.wigg_points;
CREATE TRIGGER trigger_update_user_first_good
  AFTER INSERT ON public.wigg_points
  FOR EACH ROW
  EXECUTE FUNCTION update_user_first_good();

-- Create a function to recompute title_metrics for a specific title
CREATE OR REPLACE FUNCTION recompute_title_metrics(target_title_id TEXT)
RETURNS VOID AS $$
DECLARE
  stats_record RECORD;
BEGIN
  -- Calculate aggregated stats for the target title
  SELECT
    COUNT(*) as sample_size,
    percentile_cont(0.5) WITHIN GROUP (ORDER BY first_good_pct) as median_pct,
    percentile_cont(0.75) WITHIN GROUP (ORDER BY first_good_pct) -
    percentile_cont(0.25) WITHIN GROUP (ORDER BY first_good_pct) as iqr_value
  INTO stats_record
  FROM public.user_first_good
  WHERE title_id = target_title_id;

  -- Only update if we have enough data points
  IF stats_record.sample_size >= 2 THEN
    INSERT INTO public.title_metrics (title_id, t2g_comm_pct, t2g_comm_iqr, sample_size, updated_at)
    VALUES (target_title_id, stats_record.median_pct, stats_record.iqr_value, stats_record.sample_size, now())
    ON CONFLICT (title_id) DO UPDATE SET
      t2g_comm_pct = EXCLUDED.t2g_comm_pct,
      t2g_comm_iqr = EXCLUDED.t2g_comm_iqr,
      sample_size = EXCLUDED.sample_size,
      updated_at = now();
  END IF;
END;
$$ LANGUAGE plpgsql;