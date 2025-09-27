import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { socialService } from '@/lib/api/services/social';
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

    const checkFollowingStatus = async () => {
      try {
        const result = await socialService.checkFollowing({
          followerId: user.id,
          targetUserId
        });
        if (!active) return;

        if (result.success) {
          setIsFollowing(result.data);
        } else {
          console.error('[useFollowUser] load failed', result.error);
        }
      } catch (error) {
        if (active) {
          console.error('[useFollowUser] load failed', error);
        }
      }
    };

    checkFollowingStatus();

    return () => {
      active = false;
    };
  }, [user?.id, targetUserId]);

  const follow = useCallback(async () => {
    if (!user?.id || !targetUserId || user.id === targetUserId) return;
    setLoading(true);

    try {
      const result = await socialService.followUser({
        followerId: user.id,
        targetUserId
      });

      if (result.success) {
        setIsFollowing(true);
        notifyUserFollowed({
          followerId: user.id,
          followerName: user.user_metadata?.username ?? user.email ?? 'Someone',
          targetUserId
        }).catch(() => undefined);
      } else {
        toast({ title: 'Could not follow', description: result.error.message, variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Could not follow', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.email, user?.user_metadata?.username, targetUserId, toast]);

  const unfollow = useCallback(async () => {
    if (!user?.id || !targetUserId) return;
    setLoading(true);

    try {
      const result = await socialService.unfollowUser({
        followerId: user.id,
        targetUserId
      });

      if (result.success) {
        setIsFollowing(false);
      } else {
        toast({ title: 'Could not unfollow', description: result.error.message, variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Could not unfollow', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
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

