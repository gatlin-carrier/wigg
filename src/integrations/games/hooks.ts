import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePopularGames() {
  return useQuery({
    queryKey: ['games', 'popular'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-popular-games');
      if (error) throw error;
      return data?.games ?? [];
    },
    staleTime: 1000 * 60 * 10,
  });
}

