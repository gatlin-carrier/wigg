import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

type CommentRow = {
  id: string;
  user_id: string;
  point_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string | null;
  } | null;
};

export interface WiggComment {
  id: string;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
}

export function useWiggComments(pointId?: string, enabled: boolean = true) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<WiggComment[]>([]);
  const [loading, setLoading] = useState(false);

  const loadComments = useCallback(async () => {
    if (!pointId || !enabled) {
      setComments([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('wigg_point_comments')
      .select('id, user_id, point_id, content, created_at, updated_at, profiles(username)')
      .eq('point_id', pointId)
      .order('created_at', { ascending: true });
    setLoading(false);
    if (error) {
      console.error('[useWiggComments] load failed', error);
      toast({ title: 'Could not load comments', description: error.message, variant: 'destructive' });
      return;
    }
    const mapped = (data as CommentRow[]).map((row) => ({
      id: row.id,
      userId: row.user_id,
      content: row.content,
      createdAt: row.created_at,
      username: row.profiles?.username ?? 'Anonymous',
    }));
    setComments(mapped);
  }, [pointId, enabled, toast]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const addComment = useCallback(async (content: string) => {
    if (!user?.id || !pointId) {
      toast({ title: 'Please sign in to comment', variant: 'destructive' });
      return;
    }
    const trimmed = content.trim();
    if (!trimmed) return;
    const { error } = await supabase.from('wigg_point_comments').insert({
      point_id: pointId,
      user_id: user.id,
      content: trimmed,
    });
    if (error) {
      toast({ title: 'Could not post comment', description: error.message, variant: 'destructive' });
      return;
    }
    await loadComments();
  }, [user?.id, pointId, toast, loadComments]);

  const deleteComment = useCallback(async (commentId: string) => {
    if (!user?.id) return;
    const { error } = await supabase
      .from('wigg_point_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id);
    if (error) {
      toast({ title: 'Could not delete comment', description: error.message, variant: 'destructive' });
      return;
    }
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }, [user?.id, toast]);

  return {
    comments,
    loading,
    addComment,
    deleteComment,
    refresh: loadComments,
    canComment: Boolean(user?.id && pointId),
  };
}
