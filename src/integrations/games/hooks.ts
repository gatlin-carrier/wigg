import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
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

function useDebounced<T>(value: T, delay = 350): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export function useGameSearch(q: string) {
  const query = useDebounced((q || '').trim(), 350);
  return useQuery({
    queryKey: ['games', 'search', query],
    enabled: query.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('search-games', { body: { q: query, limit: 20 } });
      if (error) throw error;
      return data?.games ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });
}
