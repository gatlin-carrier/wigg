import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { mediaClient } from '@/data/clients/mediaClient';

export function useMediaDataLayer(mediaId?: string) {
  const queryKey = useMemo(
    () => ['data-layer', 'media', mediaId] as const,
    [mediaId]
  );

  const query = useQuery({
    queryKey,
    enabled: Boolean(mediaId),
    queryFn: async () => {
      if (!mediaId) return null;
      const response = await mediaClient.getMediaById(mediaId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch media');
      }
      return response.data;
    }
  });

  return {
    data: query.data || null,
    isLoading: query.isLoading || query.isPending,
    error: query.error
      ? query.error instanceof Error
        ? query.error
        : new Error('Failed to fetch media')
      : null
  };
}