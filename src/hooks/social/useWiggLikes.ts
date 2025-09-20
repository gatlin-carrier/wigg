import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
      const [likeRes, hasRes] = await Promise.all([
        supabase.rpc('get_wigg_point_like_count', { point_id: pointId }),
        supabase.rpc('user_liked_wigg_point', { point_id: pointId, user_id: user.id }),
      ]);
      if (!active) return;
      if (!likeRes.error && typeof likeRes.data === 'number') {
        setCount(likeRes.data);
      }
      if (!hasRes.error && typeof hasRes.data === 'boolean') {
        setLiked(hasRes.data);
      }
    })();
    return () => {
      active = false;
    };
  }, [pointId, user?.id]);

  const refreshCount = useCallback(async () => {
    if (!pointId) return;
    const { data, error } = await supabase.rpc('get_wigg_point_like_count', { point_id: pointId });
    if (!error && typeof data === 'number') setCount(data);
  }, [pointId]);

  const toggleLike = useCallback(async () => {
    if (!user?.id || !pointId) {
      toast({ title: 'Please sign in to like WIGG points', variant: 'destructive' });
      return;
    }
    setLoading(true);
    if (liked) {
      const { error } = await supabase
        .from('wigg_point_likes')
        .delete()
        .eq('point_id', pointId)
        .eq('user_id', user.id);
      setLoading(false);
      if (error) {
        toast({ title: 'Could not remove like', description: error.message, variant: 'destructive' });
        return;
      }
      setLiked(false);
      setCount((c) => Math.max(0, c - 1));
    } else {
      const { error } = await supabase
        .from('wigg_point_likes')
        .insert({ point_id: pointId, user_id: user.id });
      setLoading(false);
      if (error) {
        toast({ title: 'Could not like this WIGG', description: error.message, variant: 'destructive' });
        return;
      }
      setLiked(true);
      setCount((c) => c + 1);
      if (ownerUserId && ownerUserId !== user.id) {
        notifyWiggLiked({ likerName: user.user_metadata?.username ?? user.email ?? 'Someone', ownerUserId, mediaTitle, wiggPointId: pointId }).catch(() => undefined);
      }
    }
  }, [user?.id, user?.user_metadata?.username, user?.email, pointId, liked, toast, ownerUserId]);

  return {
    liked,
    count,
    loading,
    toggleLike,
    refreshCount,
  };
}

