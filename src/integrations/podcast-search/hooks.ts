import { useQuery } from '@tanstack/react-query';
import { searchPodcasts, detectPodcastIntent, fetchTrendingPodcasts } from './client';

function toMarket(locale: string): string {
  const parts = (locale || 'en-US').split('-');
  return (parts[1] || 'US').toUpperCase();
}

export function useTrendingPodcasts(max = 24) {
  return useQuery({
    queryKey: ['podcasts', 'trending', max],
    queryFn: async () => fetchTrendingPodcasts(max),
    staleTime: 1000 * 60 * 10,
  });
}

export function usePodcastSearch(q: string, opts?: { enabled?: boolean; spotifyAccessToken?: string; spotifyConnected?: boolean }) {
  const enabled = Boolean(q && (opts?.enabled ?? detectPodcastIntent(q)));
  return useQuery({
    queryKey: ['podcast-search', q],
    enabled,
    queryFn: async () => {
      const locale = typeof navigator !== 'undefined' ? (navigator.language || 'en-US') : 'en-US';
      return searchPodcasts({
        user_query: q,
        locale,
        market: toMarket(locale),
        user_profile: { spotify_connected: !!opts?.spotifyConnected },
        cost_budget: { max_providers: 3, allow_fallbacks: true },
      }, { spotifyAccessToken: opts?.spotifyAccessToken });
    }
  });
}
