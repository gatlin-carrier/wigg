import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userPreferencesClient } from '@/data/clients/userPreferencesClient';
import { useAuth } from '@/hooks/useAuth';

export function useUserPreferencesDataLayer() {
  const { user } = useAuth();
  const userId = user?.id;

  const queryKey = useMemo(
    () => ['data-layer', 'user-preferences', userId] as const,
    [userId]
  );

  const query = useQuery({
    queryKey,
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return null;
      const response = await userPreferencesClient.getUserPreferences(userId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch user preferences');
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
        : new Error('Failed to fetch user preferences')
      : null
  };
}