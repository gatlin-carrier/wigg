import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchMovies, searchMulti, getTrendingMovies, getPopularMovies, getPopularTv, getTrendingTv, getMovieGenres, getTvGenres } from './client';

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

export function useTmdbTrending(period: 'day' | 'week' = 'day') {
  return useQuery({
    queryKey: ['tmdb', 'trending', 'movie', period],
    queryFn: () => getTrendingMovies(period),
    staleTime: 1000 * 60 * 10,
  });
}

export function useTmdbPopular() {
  return useQuery({
    queryKey: ['tmdb', 'popular', 'movie'],
    queryFn: () => getPopularMovies(1),
    staleTime: 1000 * 60 * 10,
  });
}

export function useTmdbPopularTv() {
  return useQuery({
    queryKey: ['tmdb', 'popular', 'tv'],
    queryFn: () => getPopularTv(1),
    staleTime: 1000 * 60 * 10,
  });
}

export function useTmdbTrendingTv(period: 'day' | 'week' = 'day') {
  return useQuery({
    queryKey: ['tmdb', 'trending', 'tv', period],
    queryFn: () => getTrendingTv(period),
    staleTime: 1000 * 60 * 10,
  });
}

export function useTmdbMovieGenres() {
  return useQuery({
    queryKey: ['tmdb', 'genres', 'movie'],
    queryFn: async () => {
      const res = await getMovieGenres();
      const map: Record<number, string> = {};
      for (const g of res.genres) map[g.id] = g.name;
      return map;
    },
    staleTime: 1000 * 60 * 60 * 24, // 24h
  });
}

export function useTmdbTvGenres() {
  return useQuery({
    queryKey: ['tmdb', 'genres', 'tv'],
    queryFn: async () => {
      const res = await getTvGenres();
      const map: Record<number, string> = {};
      for (const g of res.genres) map[g.id] = g.name;
      return map;
    },
    staleTime: 1000 * 60 * 60 * 24,
  });
}
