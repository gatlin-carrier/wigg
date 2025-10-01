import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { fetchTrendingAnime, fetchPopularAnime, fetchAnimeDetails, fetchPopularManga, fetchMangaDetails, fetchPopularWebtoons, fetchPopularWebtoonsAll, searchManga } from './client';
import { useEffect, useState } from 'react';

type QueryOptions<TData> = Omit<UseQueryOptions<TData, unknown, TData>, 'queryKey' | 'queryFn'>;

type AnimeListResult = Awaited<ReturnType<typeof fetchTrendingAnime>>;
type MangaListResult = Awaited<ReturnType<typeof fetchPopularManga>>;
type WebtoonListResult = Awaited<ReturnType<typeof fetchPopularWebtoons>>;

export function useAnilistAnime(kind: 'trending' | 'popular' = 'trending', options?: QueryOptions<AnimeListResult>) {
  return useQuery({
    queryKey: ['anilist', 'anime', kind, 1],
    queryFn: async () => kind === 'trending' ? fetchTrendingAnime(1, 24) : fetchPopularAnime(1, 24),
    staleTime: 1000 * 60 * 10,
    ...options,
  });
}

export function useAnilistDetails(id?: number) {
  return useQuery({
    queryKey: ['anilist', 'details', id],
    queryFn: async () => {
      if (!id) throw new Error('missing id');
      return fetchAnimeDetails(id);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 30,
  });
}

export function useAnilistManga(kind: 'popular' = 'popular', options?: QueryOptions<MangaListResult>) {
  return useQuery({
    queryKey: ['anilist', 'manga', kind, 1],
    queryFn: async () => fetchPopularManga(1, 24),
    staleTime: 1000 * 60 * 10,
    ...options,
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

export function useAnilistMangaSearch(q: string) {
  const query = useDebounced((q || '').trim(), 350);
  return useQuery({
    queryKey: ['anilist', 'manga', 'search', query],
    enabled: query.length > 0,
    queryFn: async () => searchManga(query, 1, 24),
    staleTime: 1000 * 60 * 5,
  });
}

export function useAnilistMangaDetails(id?: number) {
  return useQuery({
    queryKey: ['anilist', 'manga', 'details', id],
    queryFn: async () => {
      if (!id) throw new Error('missing id');
      return fetchMangaDetails(id);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 30,
  });
}

export function useAnilistWebtoons(country?: 'KR' | 'CN' | 'TW' | 'JP', options?: QueryOptions<WebtoonListResult>) {
  return useQuery({
    queryKey: ['anilist', 'webtoons', country ?? 'ALL', 1],
    queryFn: async () => country ? fetchPopularWebtoons(1, 24, country) : fetchPopularWebtoonsAll(1, 24),
    staleTime: 1000 * 60 * 10,
    ...options,
  });
}

export function useAnilistWebtoonsMerged(options?: QueryOptions<any[]>) {
  return useQuery({
    queryKey: ['anilist', 'webtoons', 'merged', 1],
    queryFn: async () => {
      const [kr, cn, tw] = await Promise.all([
        fetchPopularWebtoons(1, 24, 'KR'),
        fetchPopularWebtoons(1, 24, 'CN'),
        fetchPopularWebtoons(1, 24, 'TW'),
      ]);
      const map = new Map<number, any>();
      for (const arr of [kr, cn, tw]) {
        for (const r of arr || []) map.set(r.id, r);
      }
      const merged = Array.from(map.values()).sort((a: any, b: any) => (b.popularity ?? 0) - (a.popularity ?? 0));
      return merged;
    },
    staleTime: 1000 * 60 * 10,
    ...options,
  });
}
