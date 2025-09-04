-- Create movie_scenes table for community-driven scene markers
CREATE TABLE IF NOT EXISTS public.movie_scenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id uuid NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  timestamp_seconds integer NOT NULL CHECK (timestamp_seconds >= 0),
  scene_name text NOT NULL CHECK (char_length(scene_name) > 0 AND char_length(scene_name) <= 100),
  description text CHECK (char_length(description) <= 500),
  submitted_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  votes integer NOT NULL DEFAULT 0,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_movie_scenes_media_id ON public.movie_scenes(media_id);
CREATE INDEX IF NOT EXISTS idx_movie_scenes_timestamp ON public.movie_scenes(media_id, timestamp_seconds);
CREATE INDEX IF NOT EXISTS idx_movie_scenes_votes ON public.movie_scenes(media_id, votes DESC);

-- Enable RLS
ALTER TABLE public.movie_scenes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view movie scenes" ON public.movie_scenes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert movie scenes" ON public.movie_scenes 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND submitted_by = auth.uid());

CREATE POLICY "Users can update their own scenes" ON public.movie_scenes 
  FOR UPDATE USING (submitted_by = auth.uid());

CREATE POLICY "Users can delete their own scenes" ON public.movie_scenes 
  FOR DELETE USING (submitted_by = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_movie_scenes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_movie_scenes_updated_at
  BEFORE UPDATE ON public.movie_scenes
  FOR EACH ROW
  EXECUTE FUNCTION update_movie_scenes_updated_at();

-- Create table for scene votes to track user voting
CREATE TABLE IF NOT EXISTS public.movie_scene_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id uuid NOT NULL REFERENCES public.movie_scenes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vote_type integer NOT NULL CHECK (vote_type IN (-1, 0, 1)), -- -1 downvote, 0 neutral, 1 upvote
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(scene_id, user_id)
);

-- Enable RLS for votes
ALTER TABLE public.movie_scene_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for votes
CREATE POLICY "Anyone can view scene votes" ON public.movie_scene_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote" ON public.movie_scene_votes FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());
CREATE POLICY "Users can update their votes" ON public.movie_scene_votes FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their votes" ON public.movie_scene_votes FOR DELETE USING (user_id = auth.uid());

-- Create function to update scene vote counts
CREATE OR REPLACE FUNCTION update_scene_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the scene's vote count
  UPDATE public.movie_scenes 
  SET votes = (
    SELECT COALESCE(SUM(vote_type), 0)
    FROM public.movie_scene_votes 
    WHERE scene_id = COALESCE(NEW.scene_id, OLD.scene_id)
  )
  WHERE id = COALESCE(NEW.scene_id, OLD.scene_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create triggers for vote counting
CREATE TRIGGER update_scene_votes_on_insert
  AFTER INSERT ON public.movie_scene_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_scene_vote_count();

CREATE TRIGGER update_scene_votes_on_update
  AFTER UPDATE ON public.movie_scene_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_scene_vote_count();

CREATE TRIGGER update_scene_votes_on_delete
  AFTER DELETE ON public.movie_scene_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_scene_vote_count();