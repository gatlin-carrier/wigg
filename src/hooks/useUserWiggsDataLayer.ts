import { useQuery } from '@tanstack/react-query';
import { WiggEntry, UserWiggsData } from './useUserWiggs';
import { wiggPointsClient } from '../data/clients/wiggPointsClient';
import { useAuth } from './useAuth';

export const useUserWiggsDataLayer = (titleId: string) => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['userWiggs', titleId, user?.id],
    queryFn: () => wiggPointsClient.getUserWiggPoints(user?.id || '', titleId),
    enabled: !!titleId && !!user
  });

  // Transform data to match legacy format
  const transformedData: UserWiggsData | null = query.data?.success
    ? {
        entries: query.data.data.map(point => ({
          id: point.id,
          pct: point.pos_value,
          note: point.reason_short || undefined,
          createdAt: point.created_at,
          rating: undefined
        } as WiggEntry)),
        t2gEstimatePct: undefined,
        t2gConfidence: undefined
      }
    : {
        entries: [],
        t2gEstimatePct: undefined,
        t2gConfidence: undefined
      };

  return {
    data: transformedData,
    isLoading: query.isLoading,
    error: null,
    addWigg: async (pct: number, note?: string, rating?: number): Promise<void> => {
      // Placeholder implementation
    }
  };
};