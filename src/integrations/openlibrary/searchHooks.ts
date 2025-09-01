import { useQuery } from '@tanstack/react-query';
import { searchBooks } from './client';

export function useOpenLibrarySearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ['openlibrary', 'search', q],
    queryFn: () => searchBooks(q, 12),
    enabled: q.length > 0,
    staleTime: 1000 * 60 * 10,
  });
}

