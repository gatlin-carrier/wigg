import { supabase } from '@/integrations/supabase/client';

export interface PodcastUserProfile { nsfw?: boolean; spotify_connected?: boolean }

export interface PodcastSearchInput {
  user_query: string;
  locale: string;
  market: string;
  user_profile?: PodcastUserProfile;
  cost_budget: { max_providers: number; allow_fallbacks: boolean };
}

export async function searchPodcasts(input: PodcastSearchInput, opts?: { spotifyAccessToken?: string }) {
  const { data, error } = await supabase.functions.invoke('podcast-search', {
    body: { ...input, spotify_access_token: opts?.spotifyAccessToken },
  });
  if (error) throw error;
  return data as {
    resolved: {
      decision: { mode: 'auto_select' | 'disambiguate'; confidence: number; why: string[] };
      show: { id: string; appleId?: number; title: string; publisher?: string; feedUrl?: string; artwork?: { url: string } };
      episodes?: Array<{ id: string; title: string; pubDate?: string; durationSec?: number; enclosureUrl?: string }>;
      alternatives?: Array<{ title: string; appleId?: number; confidence: number; publisher?: string }>;
      query_plan_echo?: Array<any>;
    };
    telemetry: any;
  };
}

export function detectPodcastIntent(q: string): boolean {
  const pat = /(podcast|itunes\.apple\.com\/.*\/podcast\/.*\/id\d+|podcasts\.apple\.com\/.*\/id\d+|\.rss\b|\.xml\b|episode\s*#?\d+)/i;
  return pat.test(q || '');
}

