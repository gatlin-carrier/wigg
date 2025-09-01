import { useQuery } from '@tanstack/react-query';
import { fetchTrendingAnime, fetchPopularAnime, fetchAnimeDetails, fetchPopularManga, fetchMangaDetails, fetchPopularWebtoons, fetchPopularWebtoonsAll } from './client';

export function useAnilistAnime(kind: 'trending' | 'popular' = 'trending') {
  return useQuery({
    queryKey: ['anilist', 'anime', kind, 1],
    queryFn: async () => kind === 'trending' ? fetchTrendingAnime(1, 24) : fetchPopularAnime(1, 24),
    staleTime: 1000 * 60 * 10,
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

export function useAnilistManga(kind: 'popular' = 'popular') {
  return useQuery({
    queryKey: ['anilist', 'manga', kind, 1],
    queryFn: async () => fetchPopularManga(1, 24),
    staleTime: 1000 * 60 * 10,
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

export function useAnilistWebtoons(country?: 'KR' | 'CN' | 'TW' | 'JP') {
  return useQuery({
    queryKey: ['anilist', 'webtoons', country ?? 'ALL', 1],
    queryFn: async () => country ? fetchPopularWebtoons(1, 24, country) : fetchPopularWebtoonsAll(1, 24),
    staleTime: 1000 * 60 * 10,
  });
}

export function useAnilistWebtoonsMerged() {
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
  });
}
