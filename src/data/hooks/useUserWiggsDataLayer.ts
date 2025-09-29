import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { wiggPointsClient } from '@/data/clients/wiggPointsClient';
import type { WiggPoint } from '@/data/types';
import { useAuth } from '@/hooks/useAuth';

// Fix for MediaTile.tsx line 63: useUserWiggsDataLayer(titleKey, { enabled: useNewDataLayer })
// CRITICAL: Must match useUserWiggs API shape to prevent coexistence pattern failures

export interface WiggEntry {
  id: string;
  pct: number;
  note?: string;
  createdAt: string;
  rating?: number;
}

export interface UserWiggsData {
  entries: WiggEntry[];
  t2gEstimatePct?: number;
  t2gConfidence?: number;
}

interface UseUserWiggsDataLayerResult {
  data: UserWiggsData | null;
  isLoading: boolean;
  error: Error | null;
  addWigg: (pct: number, note?: string, rating?: number) => Promise<void>;
}

export function useUserWiggsDataLayer(mediaId: string, options?: { enabled?: boolean }): UseUserWiggsDataLayerResult {
  // Fix for API performance issue: MediaTile expects enabled option support
  const { enabled = true } = options || {};
  const { user } = useAuth();
  const userId = user?.id;

  const queryKey = useMemo(
    () => ['data-layer', 'user-wiggs', userId, mediaId] as const,
    [userId, mediaId]
  );

  const query = useQuery({
    queryKey,
    enabled: enabled && Boolean(userId && mediaId),
    queryFn: () => {
      if (!userId) {
        return Promise.resolve<WiggPoint[]>([]);
      }
      return wiggPointsClient.getUserWiggPoints(userId, mediaId);
    }
  });

  // Transform WiggPoint[] to UserWiggsData to match useUserWiggs API
  const data = useMemo((): UserWiggsData | null => {
    if (!query.data) return null;

    const entries: WiggEntry[] = query.data.map(point => ({
      id: point.id,
      pct: point.posValue,
      note: point.reasonShort || undefined,
      rating: undefined, // TODO: Map from point data if available
      createdAt: point.createdAt
    }));

    return {
      entries,
      t2gEstimatePct: undefined, // TODO: Calculate T2G estimate
      t2gConfidence: undefined,
    };
  }, [query.data]);

  const error = query.error
    ? query.error instanceof Error
      ? query.error
      : new Error('Failed to fetch user WIGG points')
    : null;

  const addWigg = async (pct: number, note?: string, rating?: number): Promise<void> => {
    // TODO: Implement using data layer services
    throw new Error('addWigg not implemented in data layer yet');
  };

  return {
    data,
    isLoading: query.isLoading || query.isPending,
    error,
    addWigg,
  };
}
