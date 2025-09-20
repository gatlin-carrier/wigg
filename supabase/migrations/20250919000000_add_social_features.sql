-- Social features: following, likes, comments, shares

-- User following relationships
CREATE TABLE public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Likes on WIGG points
CREATE TABLE public.wigg_point_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  point_id UUID NOT NULL REFERENCES public.wigg_points(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(point_id, user_id)
);

-- Comments on WIGG points
CREATE TABLE public.wigg_point_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  point_id UUID NOT NULL REFERENCES public.wigg_points(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Shares of WIGG points or insights
CREATE TABLE public.wigg_point_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  point_id UUID NOT NULL REFERENCES public.wigg_points(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  share_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX user_follows_follower_idx ON public.user_follows (follower_id);
CREATE INDEX user_follows_following_idx ON public.user_follows (following_id);
CREATE INDEX wigg_point_likes_point_idx ON public.wigg_point_likes (point_id);
CREATE INDEX wigg_point_likes_user_idx ON public.wigg_point_likes (user_id);
CREATE INDEX wigg_point_comments_point_idx ON public.wigg_point_comments (point_id);
CREATE INDEX wigg_point_comments_user_idx ON public.wigg_point_comments (user_id);
CREATE INDEX wigg_point_shares_point_idx ON public.wigg_point_shares (point_id);
CREATE INDEX wigg_point_shares_user_idx ON public.wigg_point_shares (user_id);

-- Enable RLS
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wigg_point_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wigg_point_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wigg_point_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- USER_FOLLOWS
CREATE POLICY "user_follows_select_all" ON public.user_follows
  FOR SELECT USING (true);

CREATE POLICY "user_follows_insert_own" ON public.user_follows
  FOR INSERT WITH CHECK (follower_id = auth.uid());

CREATE POLICY "user_follows_delete_own" ON public.user_follows
  FOR DELETE USING (follower_id = auth.uid());

-- WIGG_POINT_LIKES
CREATE POLICY "wigg_point_likes_select_all" ON public.wigg_point_likes
  FOR SELECT USING (true);

CREATE POLICY "wigg_point_likes_insert_own" ON public.wigg_point_likes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "wigg_point_likes_delete_own" ON public.wigg_point_likes
  FOR DELETE USING (user_id = auth.uid());

-- WIGG_POINT_COMMENTS
CREATE POLICY "wigg_point_comments_select_all" ON public.wigg_point_comments
  FOR SELECT USING (true);

CREATE POLICY "wigg_point_comments_insert_own" ON public.wigg_point_comments
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "wigg_point_comments_update_own" ON public.wigg_point_comments
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "wigg_point_comments_delete_own" ON public.wigg_point_comments
  FOR DELETE USING (user_id = auth.uid());

-- WIGG_POINT_SHARES
CREATE POLICY "wigg_point_shares_select_all" ON public.wigg_point_shares
  FOR SELECT USING (true);

CREATE POLICY "wigg_point_shares_insert_own" ON public.wigg_point_shares
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Helper functions for social features

-- Get follower count for a user
CREATE OR REPLACE FUNCTION public.get_follower_count(user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.user_follows
  WHERE following_id = user_id;
$$;

-- Get following count for a user
CREATE OR REPLACE FUNCTION public.get_following_count(user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.user_follows
  WHERE follower_id = user_id;
$$;

-- Check if user A follows user B
CREATE OR REPLACE FUNCTION public.is_following(follower_id UUID, following_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS(
    SELECT 1
    FROM public.user_follows
    WHERE follower_id = is_following.follower_id
      AND following_id = is_following.following_id
  );
$$;

-- Get like count for a WIGG point
CREATE OR REPLACE FUNCTION public.get_wigg_point_like_count(point_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.wigg_point_likes
  WHERE point_id = get_wigg_point_like_count.point_id;
$$;

-- Check if user liked a WIGG point
CREATE OR REPLACE FUNCTION public.user_liked_wigg_point(point_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS(
    SELECT 1
    FROM public.wigg_point_likes
    WHERE point_id = user_liked_wigg_point.point_id
      AND user_id = user_liked_wigg_point.user_id
  );
$$;

-- Update trigger for comments
CREATE TRIGGER update_wigg_point_comments_updated_at
  BEFORE UPDATE ON public.wigg_point_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();