-- Add rating_ui preference column to profiles
-- Allows selecting the preferred rating UI (buttons, dial, slider, grid, affect, swipe, hybrid, paint)

-- 1) Add column if it does not exist
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS rating_ui text;

-- 2) Set a sane default for new rows
ALTER TABLE public.profiles
  ALTER COLUMN rating_ui SET DEFAULT 'buttons';

-- 3) Backfill existing rows where null
UPDATE public.profiles
SET rating_ui = 'buttons'
WHERE rating_ui IS NULL;

-- Optional (left disabled to avoid strict coupling):
-- You can enforce valid values via a CHECK constraint if desired.
-- ALTER TABLE public.profiles
--   ADD CONSTRAINT profiles_rating_ui_check
--   CHECK (rating_ui IN ('buttons','dial','slider','grid','affect','swipe','hybrid','paint'));

