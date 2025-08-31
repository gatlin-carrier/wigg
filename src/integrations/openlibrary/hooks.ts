import { useQuery } from '@tanstack/react-query';
import { fetchTrendingBooks, normalizeWork, OLTrendingPeriod } from './client';

export function useOpenLibraryTrending(period: OLTrendingPeriod = 'weekly') {
  return useQuery({
    queryKey: ['openlibrary', 'trending', period],
    queryFn: async () => {
      const works = await fetchTrendingBooks(period);
      return works.map(normalizeWork);
    },
    staleTime: 1000 * 60 * 10,
  });
}

