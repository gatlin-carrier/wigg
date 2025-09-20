ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS accent_color TEXT,
  ADD COLUMN IF NOT EXISTS theme_mode TEXT DEFAULT 'system';
