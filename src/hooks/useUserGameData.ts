import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserGameData {
  id: string;
  userId: string;
  mediaId: string;
  completionTimeHours: number;
  createdAt: string;
  updatedAt: string;
}

export function useUserGameData(mediaId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-game-data', user?.id, mediaId],
    queryFn: async (): Promise<UserGameData | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_game_data')
        .select('*')
        .eq('user_id', user.id)
        .eq('media_id', mediaId)
        .maybeSingle();

      if (error) throw error;

      if (!data) return null;

      return {
        id: data.id,
        userId: data.user_id,
        mediaId: data.media_id,
        completionTimeHours: data.completion_time_hours,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    },
    enabled: !!user && !!mediaId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useSetGameCompletionTime() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      mediaId,
      completionTimeHours,
    }: {
      mediaId: string;
      completionTimeHours: number;
    }) => {
      if (!user) throw new Error('Must be authenticated to set game completion time');

      const { data, error } = await supabase
        .from('user_game_data')
        .upsert({
          user_id: user.id,
          media_id: mediaId,
          completion_time_hours: completionTimeHours,
        }, {
          onConflict: 'user_id, media_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch user game data
      queryClient.invalidateQueries({ 
        queryKey: ['user-game-data', user?.id, variables.mediaId] 
      });
    },
  });
}

export function useGameStats(mediaId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['game-stats', mediaId],
    queryFn: async () => {
      // Get average completion time and other stats for this game
      const { data, error } = await supabase
        .from('user_game_data')
        .select('completion_time_hours')
        .eq('media_id', mediaId);

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          averageCompletionTime: null,
          totalPlayers: 0,
        };
      }

      const completionTimes = data.map(d => d.completion_time_hours);
      const averageCompletionTime = completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;

      return {
        averageCompletionTime,
        totalPlayers: completionTimes.length,
      };
    },
    enabled: !!mediaId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}