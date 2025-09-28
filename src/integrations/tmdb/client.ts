import type { TmdbSearchResponse, TmdbMovie } from './types';
import { supabaseConfig } from '@/integrations/supabase/config';

async function tmdbGet<T>(path: string, params: Record<string, any> = {}): Promise<T> {
  const { url: supabaseUrl, anonKey: supabaseAnon } = supabaseConfig;

  const u = new URLSearchParams();
  // No api_key needed - Edge Function handles authentication server-side
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') u.set(k, String(v));
  const qs = u.toString();

  const headers: HeadersInit = supabaseAnon
    ? { apikey: supabaseAnon, Authorization: `Bearer ${supabaseAnon}` }
    : {};

  const baseUrl = supabaseUrl.replace(/\/$/, '');
  const querySuffix = qs.length > 0 ? `?${qs}` : '';
  const url = `${baseUrl}/functions/v1/tmdb${path}${querySuffix}`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`TMDB ${res.status}: ${errorBody}`);
  }
  return res.json() as Promise<T>;
}

export function getImageUrl(path?: string | null, size: 'w92'|'w154'|'w185'|'w342'|'w500'|'w780'|'original' = 'w342') {
  if (!path) return undefined;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export async function searchMovies(query: string, page = 1) {
  return tmdbGet<TmdbSearchResponse<TmdbMovie>>('/search/movie', { query, page, include_adult: false, language: 'en-US' });
}

export async function searchMulti(query: string, page = 1) {
  return tmdbGet<TmdbSearchResponse<TmdbMovie>>('/search/multi', { query, page, include_adult: false, language: 'en-US' });
}

export async function getMovieDetails(id: number) {
  return tmdbGet<TmdbMovie>(`/movie/${id}`, { language: 'en-US' });
}

export async function getTrendingMovies(period: 'day' | 'week' = 'day', page = 1) {
  return tmdbGet<TmdbSearchResponse<TmdbMovie>>(`/trending/movie/${period}`, { page });
}

export async function getPopularMovies(page = 1) {
  return tmdbGet<TmdbSearchResponse<TmdbMovie>>('/movie/popular', { page, language: 'en-US' });
}

// TV endpoints
export async function getTrendingTv(period: 'day' | 'week' = 'day', page = 1) {
  return tmdbGet<TmdbSearchResponse<TmdbMovie>>(`/trending/tv/${period}`, { page });
}

export async function getPopularTv(page = 1) {
  return tmdbGet<TmdbSearchResponse<TmdbMovie>>('/tv/popular', { page, language: 'en-US' });
}

export async function getTvDetails(id: number) {
  return tmdbGet<any>(`/tv/${id}`, { language: 'en-US' });
}

export async function getTvSeasons(tvId: number) {
  const details = await getTvDetails(tvId);
  return details.seasons || [];
}

export async function getTvSeasonDetails(tvId: number, seasonNumber: number) {
  // Validate inputs
  if (!tvId || tvId <= 0) {
    throw new Error(`Invalid TMDB TV ID: ${tvId}`);
  }
  if (!seasonNumber || seasonNumber <= 0) {
    throw new Error(`Invalid season number: ${seasonNumber}`);
  }
  
  return tmdbGet<any>(`/tv/${tvId}/season/${seasonNumber}`, { language: 'en-US' });
}

export async function getTvEpisodes(tvId: number, seasonNumber = 1) {
  // Validate inputs
  if (!tvId || tvId <= 0) {
    throw new Error(`Invalid TMDB TV ID: ${tvId}`);
  }
  if (!seasonNumber || seasonNumber <= 0) {
    throw new Error(`Invalid season number: ${seasonNumber}`);
  }
  
  const seasonData = await getTvSeasonDetails(tvId, seasonNumber);
  return seasonData.episodes?.map((ep: any, index: number) => ({
    id: `tmdb-ep-${tvId}-s${seasonNumber}e${ep.episode_number}`,
    title: `S${seasonNumber}E${ep.episode_number}: ${ep.name || `Episode ${ep.episode_number}`}`,
    ordinal: index + 1,
    subtype: "episode" as const,
    runtimeSec: ep.runtime ? ep.runtime * 60 : 42 * 60,
    description: ep.overview,
    airDate: ep.air_date,
    episodeNumber: ep.episode_number,
    seasonNumber: seasonNumber,
  })) || [];
}

// Genre lists (use to map genre_ids -> names)
export async function getMovieGenres() {
  return tmdbGet<{ genres: { id: number; name: string }[] }>(`/genre/movie/list`, { language: 'en-US' });
}

export async function getTvGenres() {
  return tmdbGet<{ genres: { id: number; name: string }[] }>(`/genre/tv/list`, { language: 'en-US' });
}

// Anime discovery (heuristic): Animation genre + original language Japanese
export async function discoverAnimeTv(page = 1, language: 'ja-JP' | 'en-US' = 'ja-JP') {
  return tmdbGet<TmdbSearchResponse<any>>('/discover/tv', {
    page,
    sort_by: 'popularity.desc',
    with_genres: 16, // Animation
    with_original_language: 'ja',
    language,
    include_adult: false,
  });
}

export async function discoverAnimeMovies(page = 1, language: 'ja-JP' | 'en-US' = 'ja-JP') {
  return tmdbGet<TmdbSearchResponse<any>>('/discover/movie', {
    page,
    sort_by: 'popularity.desc',
    with_genres: 16, // Animation
    with_original_language: 'ja',
    language,
    include_adult: false,
  });
}
