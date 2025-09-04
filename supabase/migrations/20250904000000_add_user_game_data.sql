-- Create user_game_data table for storing user-specific game completion times
CREATE TABLE IF NOT EXISTS public.user_game_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  completion_time_hours numeric NOT NULL CHECK (completion_time_hours > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Ensure one record per user per game
  UNIQUE(user_id, media_id)
);

-- Enable RLS
ALTER TABLE public.user_game_data ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own game data" 
ON public.user_game_data FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game data" 
ON public.user_game_data FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game data" 
ON public.user_game_data FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own game data" 
ON public.user_game_data FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_game_data_user_id ON public.user_game_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_game_data_media_id ON public.user_game_data(media_id);
CREATE INDEX IF NOT EXISTS idx_user_game_data_user_media ON public.user_game_data(user_id, media_id);

-- Add trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_game_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_game_data_updated_at
  BEFORE UPDATE ON public.user_game_data
  FOR EACH ROW
  EXECUTE FUNCTION update_user_game_data_updated_at();