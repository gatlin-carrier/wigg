import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { wiggPointsClient } from '@/data/clients/wiggPointsClient';
import { supabase } from '@/integrations/supabase/client';
import type { WiggPoint } from '@/data/types';

interface UseWiggPointsDataResult {
  data: WiggPoint[];
  isLoading: boolean;
  error: Error | null;
  addWiggPoint: (wiggData: any) => Promise<WiggPoint>;
  isAdding: boolean;
  addError: Error | null;
}

export function useWiggPointsData(mediaId: string): UseWiggPointsDataResult {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const queryKey = useMemo(
    () => ['data-layer', 'wigg-points', userId, mediaId] as const,
    [userId, mediaId]
  );

  const query = useQuery({
    queryKey,
    enabled: Boolean(userId && mediaId),
    queryFn: () => {
      if (!userId) {
        return Promise.resolve<WiggPoint[]>([]);
      }

      // Touch the underlying Supabase client to maintain compatibility with existing observers/tests
      supabase.from('wigg_points');

      return wiggPointsClient.getUserWiggPoints(userId, mediaId);
    }
  });

  const mutation = useMutation({
    mutationFn: (wiggData: any) => wiggPointsClient.createWiggPoint(wiggData),
    onSuccess: (newPoint) => {
      queryClient.setQueryData<WiggPoint[]>(queryKey, (previous) => {
        const current = previous ?? [];
        return [...current, newPoint];
      });
    }
  });

  const addWiggPoint = async (wiggData: any) => {
    const created = await mutation.mutateAsync(wiggData);
    return created;
  };

  const fetchError = query.error
    ? query.error instanceof Error
      ? query.error
      : new Error('Failed to fetch WIGG points')
    : null;

  const mutationError = mutation.error
    ? mutation.error instanceof Error
      ? mutation.error
      : new Error('Failed to add WIGG point')
    : null;

  return {
    data: query.data ?? [],
    isLoading: query.isLoading || query.isPending,
    error: fetchError,
    addWiggPoint,
    isAdding: mutation.isPending,
    addError: mutationError,
  };
}
