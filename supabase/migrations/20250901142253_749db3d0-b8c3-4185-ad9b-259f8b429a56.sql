-- Update profiles table to support media type priorities
-- First add a new column for the JSONB preferences
ALTER TABLE public.profiles 
ADD COLUMN media_preferences jsonb DEFAULT '[
  {"type": "Movie", "priority": 1},
  {"type": "TV Show", "priority": 2},
  {"type": "Game", "priority": 3},
  {"type": "Book", "priority": 4},
  {"type": "Podcast", "priority": 5}
]'::jsonb;

-- Create a function to migrate existing data
CREATE OR REPLACE FUNCTION migrate_media_preferences()
RETURNS void AS $$
DECLARE
  rec RECORD;
  media_type text;
  priority_counter int;
  preferences jsonb := '[]'::jsonb;
BEGIN
  FOR rec IN SELECT id, preferred_media_types FROM public.profiles WHERE preferred_media_types IS NOT NULL LOOP
    preferences := '[]'::jsonb;
    priority_counter := 1;
    
    -- Convert array to jsonb with priorities
    FOR media_type IN SELECT unnest(rec.preferred_media_types) LOOP
      preferences := preferences || jsonb_build_array(
        jsonb_build_object('type', media_type, 'priority', priority_counter)
      );
      priority_counter := priority_counter + 1;
    END LOOP;
    
    -- Update the new column
    UPDATE public.profiles 
    SET media_preferences = preferences 
    WHERE id = rec.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the migration function
SELECT migrate_media_preferences();

-- Drop the migration function
DROP FUNCTION migrate_media_preferences();

-- Drop the old column
ALTER TABLE public.profiles DROP COLUMN preferred_media_types;

-- Rename the new column to the old name
ALTER TABLE public.profiles RENAME COLUMN media_preferences TO preferred_media_types;