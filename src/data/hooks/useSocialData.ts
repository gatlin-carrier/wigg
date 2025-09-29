import { useQuery } from '@tanstack/react-query';
import { socialClient } from '../clients/socialClient';

export const useSocialData = (pointId: string, userId: string) => {
  const likeCountQuery = useQuery({
    queryKey: ['likeCount', pointId],
    queryFn: () => socialClient.getLikeCount(pointId),
    enabled: !!pointId
  });

  const hasUserLikedQuery = useQuery({
    queryKey: ['hasUserLiked', pointId, userId],
    queryFn: () => socialClient.hasUserLiked(pointId, userId),
    enabled: !!pointId && !!userId
  });

  return {
    isLoading: likeCountQuery.isLoading || hasUserLikedQuery.isLoading,
    likeCount: likeCountQuery.data?.success ? likeCountQuery.data.data : undefined,
    hasUserLiked: hasUserLikedQuery.data?.success ? hasUserLikedQuery.data.data : undefined,
    error: likeCountQuery.error || hasUserLikedQuery.error
  };
};