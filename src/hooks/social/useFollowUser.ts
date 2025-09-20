import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { notifyUserFollowed } from '@/services/notificationTriggers';

export function useFollowUser(targetUserId?: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.id || !targetUserId || user.id === targetUserId) {
      setIsFollowing(false);
      return;
    }
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .maybeSingle();
      if (!active) return;
      if (error) {
        console.error('[useFollowUser] load failed', error);
        return;
      }
      setIsFollowing(Boolean(data));
    })();
    return () => {
      active = false;
    };
  }, [user?.id, targetUserId]);

  const follow = useCallback(async () => {
    if (!user?.id || !targetUserId || user.id === targetUserId) return;
    setLoading(true);
    const { error } = await supabase.from('user_follows').insert({
      follower_id: user.id,
      following_id: targetUserId,
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Could not follow', description: error.message, variant: 'destructive' });
      return;
    }
    setIsFollowing(true);
    notifyUserFollowed({ followerId: user.id, followerName: user.user_metadata?.username ?? user.email ?? 'Someone', targetUserId }).catch(() => undefined);
  }, [user?.id, user?.email, targetUserId, toast]);

  const unfollow = useCallback(async () => {
    if (!user?.id || !targetUserId) return;
    setLoading(true);
    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId);
    setLoading(false);
    if (error) {
      toast({ title: 'Could not unfollow', description: error.message, variant: 'destructive' });
      return;
    }
    setIsFollowing(false);
  }, [user?.id, targetUserId, toast]);

  const toggle = useCallback(async () => {
    if (loading) return;
    if (isFollowing) {
      await unfollow();
    } else {
      await follow();
    }
  }, [loading, isFollowing, follow, unfollow]);

  return {
    isFollowing,
    loading,
    follow,
    unfollow,
    toggle,
    isOwnProfile: user?.id === targetUserId,
  };
}

