import { useQuery } from '@tanstack/react-query';
import { socialClient } from '../../data/clients/socialClient';
import { useAuth } from '../useAuth';

export interface WiggComment {
  id: string;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
}

export function useWiggCommentsDataLayer(pointId?: string) {
  const { user } = useAuth();

  const commentsQuery = useQuery({
    queryKey: ['comments', pointId],
    queryFn: () => socialClient.getComments(pointId || ''),
    enabled: !!pointId
  });

  return {
    comments: commentsQuery.data || [],
    loading: commentsQuery.isLoading || commentsQuery.isPending,
    addComment: async () => {},
    deleteComment: async () => {},
    refresh: async () => {},
    canComment: Boolean(user?.id && pointId),
  };
}