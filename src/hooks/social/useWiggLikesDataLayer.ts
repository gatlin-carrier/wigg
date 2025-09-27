import { useQuery } from '@tanstack/react-query';
import { socialClient } from '../../data/clients/socialClient';
import { useAuth } from '../useAuth';

export const useWiggLikesDataLayer = (pointId: string) => {
  const { user } = useAuth();

  const likeCountQuery = useQuery({
    queryKey: ['likeCount', pointId],
    queryFn: () => socialClient.getLikeCount(pointId),
    enabled: !!pointId
  });

  const hasUserLikedQuery = useQuery({
    queryKey: ['hasUserLiked', pointId, user?.id],
    queryFn: () => socialClient.hasUserLiked(pointId, user?.id || ''),
    enabled: !!pointId && !!user
  });

  return {
    liked: hasUserLikedQuery.data?.success ? hasUserLikedQuery.data.data : false,
    count: likeCountQuery.data?.success ? likeCountQuery.data.data : 0,
    loading: likeCountQuery.isLoading || hasUserLikedQuery.isLoading,
    toggleLike: () => {},
    refreshCount: () => {}
  };
};