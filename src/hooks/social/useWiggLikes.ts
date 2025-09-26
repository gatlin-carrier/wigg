import { useCallback, useEffect, useState } from 'react';
import { socialService } from '@/lib/api/services/social';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { notifyWiggLiked } from '@/services/notificationTriggers';

export function useWiggLikes(pointId?: string, ownerUserId?: string, mediaTitle?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pointId || !user?.id) {
      setLiked(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        const [likeRes, hasRes] = await Promise.all([
          socialService.getLikeCount(pointId),
          socialService.hasUserLiked(pointId, user.id),
        ]);
        if (!active) return;
        if (likeRes.success && typeof likeRes.data === 'number') {
          setCount(likeRes.data);
        }
        if (hasRes.success && typeof hasRes.data === 'boolean') {
          setLiked(hasRes.data);
        }
      } catch (error) {
        console.error('Error fetching like data:', error);
      }
    })();
    return () => {
      active = false;
    };
  }, [pointId, user?.id]);

  const refreshCount = useCallback(async () => {
    if (!pointId) return;
    try {
      const result = await socialService.getLikeCount(pointId);
      if (result.success && typeof result.data === 'number') setCount(result.data);
    } catch (error) {
      console.error('Error refreshing like count:', error);
    }
  }, [pointId]);

  const toggleLike = useCallback(async () => {
    if (!user?.id || !pointId) {
      toast({ title: 'Please sign in to like WIGG points', variant: 'destructive' });
      return;
    }
    setLoading(true);

    try {
      const result = await socialService.toggleLike({
        pointId,
        userId: user.id,
        isLiked: liked
      });

      if (!result.success) {
        toast({
          title: liked ? 'Could not remove like' : 'Could not like this WIGG',
          description: result.error.message,
          variant: 'destructive'
        });
        return;
      }

      if (liked) {
        setLiked(false);
        setCount((c) => Math.max(0, c - 1));
      } else {
        setLiked(true);
        setCount((c) => c + 1);
        if (ownerUserId && ownerUserId !== user.id) {
          notifyWiggLiked({
            likerName: user.user_metadata?.username ?? user.email ?? 'Someone',
            ownerUserId,
            mediaTitle,
            wiggPointId: pointId
          }).catch(() => undefined);
        }
      }
    } catch (error: any) {
      toast({
        title: liked ? 'Could not remove like' : 'Could not like this WIGG',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.user_metadata?.username, user?.email, pointId, liked, toast, ownerUserId, mediaTitle]);

  return {
    liked,
    count,
    loading,
    toggleLike,
    refreshCount,
  };
}

