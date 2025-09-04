-- Update user_game_data table to allow infinity values for endless games
-- Remove the CHECK constraint that prevents infinity values
ALTER TABLE public.user_game_data 
DROP CONSTRAINT IF EXISTS user_game_data_completion_time_hours_check;

-- Add new constraint that allows positive values and infinity
ALTER TABLE public.user_game_data 
ADD CONSTRAINT user_game_data_completion_time_hours_check 
CHECK (completion_time_hours > 0 OR completion_time_hours = 'Infinity'::numeric);