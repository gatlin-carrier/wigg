import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useFollowerCounts(userId?: string | null) {
  const [followers, setFollowers] = useState<number | null>(null);
  const [following, setFollowing] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setFollowers(null);
      setFollowing(null);
      return;
    }
    let active = true;
    setLoading(true);
    Promise.all([
      supabase.rpc('get_follower_count', { user_id: userId }),
      supabase.rpc('get_following_count', { user_id: userId }),
    ]).then(([followerRes, followingRes]) => {
      if (!active) return;
      if (!followerRes.error) setFollowers(followerRes.data as number);
      if (!followingRes.error) setFollowing(followingRes.data as number);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [userId]);

  return {
    followers,
    following,
    loading,
  };
}
