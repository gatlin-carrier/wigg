import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { wiggPointsClient } from '@/data/clients/wiggPointsClient';
import type { WiggPoint } from '@/data/types';
import { useAuth } from '@/hooks/useAuth';

interface UseUserWiggsDataLayerResult {
  data: WiggPoint[];
  isLoading: boolean;
  error: Error | null;
}

export function useUserWiggsDataLayer(mediaId: string): UseUserWiggsDataLayerResult {
  const { user } = useAuth();
  const userId = user?.id;

  const queryKey = useMemo(
    () => ['data-layer', 'user-wiggs', userId, mediaId] as const,
    [userId, mediaId]
  );

  const query = useQuery({
    queryKey,
    enabled: Boolean(userId && mediaId),
    queryFn: () => {
      if (!userId) {
        return Promise.resolve<WiggPoint[]>([]);
      }
      return wiggPointsClient.getUserWiggPoints(userId, mediaId);
    }
  });

  const data = query.data ?? [];
  const error = query.error
    ? query.error instanceof Error
      ? query.error
      : new Error('Failed to fetch user WIGG points')
    : null;

  return {
    data,
    isLoading: query.isLoading || query.isPending,
    error,
  };
}
