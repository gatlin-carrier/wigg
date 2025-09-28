import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socialClient } from '../../data/clients/socialClient';
import { useAuth } from '../useAuth';

export function useFollowUserDataLayer(targetUserId?: string | null) {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const followQuery = useQuery({
    queryKey: ['isFollowing', userId, targetUserId],
    queryFn: () => socialClient.isFollowing(userId || '', targetUserId || ''),
    enabled: !!userId && !!targetUserId && userId !== targetUserId
  });

  const toggleMutation = useMutation({
    mutationFn: async () => {
      const isCurrentlyFollowing = followQuery.data ?? false;
      if (isCurrentlyFollowing) {
        await socialClient.unfollowUser(userId || '', targetUserId || '');
      } else {
        await socialClient.followUser(userId || '', targetUserId || '');
      }
    },
    onSuccess: () => {
      // Invalidate the query to refetch the latest follow status
      queryClient.invalidateQueries({ queryKey: ['isFollowing', userId, targetUserId] });
    }
  });

  return {
    isFollowing: followQuery.data ?? false,
    loading: followQuery.isLoading || followQuery.isPending,
    toggle: () => toggleMutation.mutate(),
    isOwnProfile: userId === targetUserId,
  };
}