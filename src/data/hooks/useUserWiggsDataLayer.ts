import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { wiggPointsClient } from '@/data/clients/wiggPointsClient';
import type { WiggPoint } from '@/data/types';
import { useAuth } from '@/hooks/useAuth';
import { firstGoodFromWiggs, pickT2G } from '@/lib/wigg/analysis';

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
      pct: point.pos_value,
      note: point.reason_short || undefined,
      rating: undefined, // TODO: Map from point data if available
      createdAt: point.created_at
    }));

    // Calculate T2G estimate using existing analysis functions
    const personalT2G = firstGoodFromWiggs(entries, 1);
    const t2gResult = pickT2G(personalT2G, null); // No community data in this context

    return {
      entries,
      t2gEstimatePct: t2gResult.pct,
      t2gConfidence: t2gResult.confidence,
    };
  }, [query.data]);

  const error = query.error
    ? query.error instanceof Error
      ? query.error
      : new Error('Failed to fetch user WIGG points')
    : null;

  const addWigg = async (pct: number, note?: string, rating?: number): Promise<void> => {
    if (!userId || !mediaId) {
      throw new Error('User ID and media ID are required to add a wigg');
    }

    await wiggPointsClient.createWiggPoint({
      media_id: mediaId,
      user_id: userId,
      pos_value: pct,
      pos_kind: 'percent',
      reason_short: note,
      spoiler_level: 0, // Default spoiler level
    });
  };

  return {
    data,
    isLoading: query.isLoading || query.isPending,
    error,
    addWigg,
  };
}
