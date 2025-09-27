import { useCallback, useEffect, useState } from 'react';
import { socialService } from '@/lib/api/services/social';
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
    const result = await socialService.getComments(pointId);
    setLoading(false);
    if (!result.success) {
      console.error('[useWiggComments] load failed', result.error);
      toast({ title: 'Could not load comments', description: result.error.message, variant: 'destructive' });
      return;
    }
    setComments(result.data);
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
    const result = await socialService.addComment({
      pointId,
      userId: user.id,
      content: trimmed,
    });
    if (!result.success) {
      toast({ title: 'Could not post comment', description: result.error.message, variant: 'destructive' });
      return;
    }
    await loadComments();
  }, [user?.id, pointId, toast, loadComments]);

  const deleteComment = useCallback(async (commentId: string) => {
    if (!user?.id) return;
    const result = await socialService.deleteComment({
      commentId,
      userId: user.id,
    });
    if (!result.success) {
      toast({ title: 'Could not delete comment', description: result.error.message, variant: 'destructive' });
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
