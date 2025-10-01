import { useEffect, useMemo, useState } from 'react';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { searchMovies, searchMulti, getTrendingMovies, getPopularMovies, getPopularTv, getTrendingTv, getMovieGenres, getTvGenres, discoverAnimeMovies, discoverAnimeTv } from './client';

type QueryOptions<TData> = Omit<UseQueryOptions<TData, unknown, TData>, 'queryKey' | 'queryFn'>;

type TrendingMoviesResult = Awaited<ReturnType<typeof getTrendingMovies>>;
type PopularMoviesResult = Awaited<ReturnType<typeof getPopularMovies>>;
type TrendingTvResult = Awaited<ReturnType<typeof getTrendingTv>>;
type PopularTvResult = Awaited<ReturnType<typeof getPopularTv>>;
type MovieGenresResult = Awaited<ReturnType<typeof getMovieGenres>>;
type TvGenresResult = Awaited<ReturnType<typeof getTvGenres>>;

function useDebounced<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export function useTmdbSearch(query: string, mode: 'movie' | 'multi' = 'movie') {
  const q = useDebounced(query.trim(), 350);
  const enabled = q.length > 0;
  return useQuery({
    queryKey: ['tmdb', 'search', mode, q],
    queryFn: async () => (mode === 'movie' ? searchMovies(q) : searchMulti(q)),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

export function useTmdbTrending(period: 'day' | 'week' = 'day', options?: QueryOptions<TrendingMoviesResult>) {
  return useQuery({
    queryKey: ['tmdb', 'trending', 'movie', period],
    queryFn: () => getTrendingMovies(period),
    staleTime: 1000 * 60 * 10,
    ...options,
  });
}

export function useTmdbPopular(options?: QueryOptions<PopularMoviesResult>) {
  return useQuery({
    queryKey: ['tmdb', 'popular', 'movie'],
    queryFn: () => getPopularMovies(1),
    staleTime: 1000 * 60 * 10,
    ...options,
  });
}

export function useTmdbPopularTv(options?: QueryOptions<PopularTvResult>) {
  return useQuery({
    queryKey: ['tmdb', 'popular', 'tv'],
    queryFn: () => getPopularTv(1),
    staleTime: 1000 * 60 * 10,
    ...options,
  });
}

export function useTmdbTrendingTv(period: 'day' | 'week' = 'day', options?: QueryOptions<TrendingTvResult>) {
  return useQuery({
    queryKey: ['tmdb', 'trending', 'tv', period],
    queryFn: () => getTrendingTv(period),
    staleTime: 1000 * 60 * 10,
    ...options,
  });
}

export function useTmdbMovieGenres(options?: QueryOptions<Record<number, string>>) {
  return useQuery({
    queryKey: ['tmdb', 'genres', 'movie'],
    queryFn: async () => {
      const res = await getMovieGenres();
      const map: Record<number, string> = {};
      for (const g of res.genres) map[g.id] = g.name;
      return map;
    },
    staleTime: 1000 * 60 * 60 * 24, // 24h
    ...options,
  });
}

export function useTmdbTvGenres(options?: QueryOptions<Record<number, string>>) {
  return useQuery({
    queryKey: ['tmdb', 'genres', 'tv'],
    queryFn: async () => {
      const res = await getTvGenres();
      const map: Record<number, string> = {};
      for (const g of res.genres) map[g.id] = g.name;
      return map;
    },
    staleTime: 1000 * 60 * 60 * 24,
    ...options,
  });
}

export function useTmdbAnime(options?: QueryOptions<{ results: any[] }>) {
  return useQuery({
    queryKey: ['tmdb', 'discover', 'anime', 'ja+en', 1],
    queryFn: async () => {
      const [tvJA, moviesJA, tvEN, moviesEN] = await Promise.all([
        discoverAnimeTv(1, 'ja-JP'),
        discoverAnimeMovies(1, 'ja-JP'),
        discoverAnimeTv(1, 'en-US'),
        discoverAnimeMovies(1, 'en-US'),
      ]);

      const tvEnTitle = new Map<number, string>();
      for (const r of tvEN.results || []) tvEnTitle.set(r.id, r.name || r.original_name || '');
      const movieEnTitle = new Map<number, string>();
      for (const r of moviesEN.results || []) movieEnTitle.set(r.id, r.title || r.original_title || '');

      // Tag each item with its type and attach en/ja titles
      const tvItems = (tvJA.results || []).map((r: any) => ({
        ...r,
        __kind: 'tv' as const,
        __title_en: tvEnTitle.get(r.id) || r.name || r.original_name,
        __title_ja: r.name || r.original_name,
      }));
      const movieItems = (moviesJA.results || []).map((r: any) => ({
        ...r,
        __kind: 'movie' as const,
        __title_en: movieEnTitle.get(r.id) || r.title || r.original_title,
        __title_ja: r.title || r.original_title,
      }));
      // Merge by popularity desc, take top 24
      const merged = [...tvItems, ...movieItems]
        .sort((a: any, b: any) => (b.popularity ?? 0) - (a.popularity ?? 0))
        .slice(0, 24);
      return { results: merged };
    },
    staleTime: 1000 * 60 * 10,
    ...options,
  });
}
