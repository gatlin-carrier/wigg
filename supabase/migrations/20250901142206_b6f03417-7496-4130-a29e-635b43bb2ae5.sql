-- Update profiles table to support media type priorities
-- Change preferred_media_types from text[] to jsonb to store both type and priority
ALTER TABLE public.profiles 
ALTER COLUMN preferred_media_types TYPE jsonb 
USING (
  CASE 
    WHEN preferred_media_types IS NULL THEN '[]'::jsonb
    ELSE (
      SELECT jsonb_agg(
        jsonb_build_object(
          'type', media_type,
          'priority', row_number() OVER ()
        )
      )
      FROM unnest(preferred_media_types) AS media_type
    )
  END
);

-- Update the default value to use the new JSONB format
ALTER TABLE public.profiles 
ALTER COLUMN preferred_media_types SET DEFAULT '[
  {"type": "Movie", "priority": 1},
  {"type": "TV Show", "priority": 2},
  {"type": "Game", "priority": 3},
  {"type": "Book", "priority": 4},
  {"type": "Podcast", "priority": 5}
]'::jsonb;