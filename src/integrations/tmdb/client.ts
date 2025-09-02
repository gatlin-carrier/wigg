import type { TmdbSearchResponse, TmdbMovie } from './types';

const TMDB_API_BASE = 'https://api.themoviedb.org/3';

async function tmdbGet<T>(path: string, params: Record<string, any> = {}): Promise<T> {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY as string | undefined;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const supabaseAnon = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  const useProxy = !apiKey;

  const u = new URLSearchParams();
  // Only include api_key when calling TMDB directly from the browser
  if (!useProxy) u.set('api_key', apiKey as string);
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') u.set(k, String(v));
  const qs = u.toString();

  const url = useProxy
    ? `${supabaseUrl}/functions/v1/tmdb${path}?${qs}`
    : `${TMDB_API_BASE}${path}?${qs}`;

  const headers: HeadersInit = useProxy && supabaseAnon
    ? { apikey: supabaseAnon, Authorization: `Bearer ${supabaseAnon}` }
    : {};

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${await res.text()}`);
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
