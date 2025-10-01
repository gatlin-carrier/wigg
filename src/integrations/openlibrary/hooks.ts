import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { fetchTrendingBooks, normalizeWork, OLTrendingPeriod } from './client';

type QueryOptions<TData> = Omit<UseQueryOptions<TData, unknown, TData>, 'queryKey' | 'queryFn'>;

type TrendingBooksResult = ReturnType<typeof normalizeWork>;

export function useOpenLibraryTrending(period: OLTrendingPeriod = 'weekly', options?: QueryOptions<TrendingBooksResult[]>) {
  return useQuery({
    queryKey: ['openlibrary', 'trending', period],
    queryFn: async () => {
      const works = await fetchTrendingBooks(period);
      return works.map(normalizeWork);
    },
    staleTime: 1000 * 60 * 10,
    ...options,
  });
}

