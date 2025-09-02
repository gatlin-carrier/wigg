// Minimal shared types for the podcast search edge function

export type Provider = 'apple' | 'podcastindex' | 'spotify';

export interface UserProfile {
  nsfw?: boolean;
  spotify_connected?: boolean;
}

export interface CostBudget {
  max_providers: number;
  allow_fallbacks: boolean;
}

export interface PodcastSearchInput {
  user_query: string;
  locale: string; // e.g., "en-US"
  market: string; // e.g., "US"
  user_profile?: UserProfile;
  cost_budget: CostBudget;
}

export interface QueryPlan {
  provider: Provider;
  endpoint: string; // 'search', 'podcasts/byitunesid', 'episodes/byfeedid', 'me/shows'
  params: Record<string, any>;
  weight: number;
  reason: string;
  timeout_ms: number;
  only_if?: string;
}

export interface ProviderResult<T = any> {
  ok: boolean;
  t_ms: number;
  data?: T;
  error?: string;
}

export interface RawResults {
  raw: Record<string, ProviderResult>;
}

export interface ResolvedArtwork { url: string }

export interface ResolvedEpisodeTranscript {
  source: 'podcastindex';
  url: string;
  type?: string;
}

export interface ResolvedEpisodeChapters {
  source: 'podcastindex';
  url: string;
}

export interface ResolvedEpisode {
  id: string;
  title: string;
  pubDate?: string;
  durationSec?: number;
  enclosureUrl?: string;
  chapters?: ResolvedEpisodeChapters | null;
  transcript?: ResolvedEpisodeTranscript | null;
}

export interface ResolvedShow {
  id: string; // e.g., 'pi:feed:920666'
  appleId?: number;
  title: string;
  publisher?: string;
  feedUrl?: string;
  artwork?: ResolvedArtwork;
}

export interface ResolvedPodcastDecision {
  mode: 'auto_select' | 'disambiguate';
  confidence: number;
  why: string[];
}

export interface ResolvedPodcast {
  decision: ResolvedPodcastDecision;
  show: ResolvedShow;
  episodes?: ResolvedEpisode[];
  alternatives?: Array<{ title: string; appleId?: number; confidence: number; publisher?: string }>;
  query_plan_echo?: QueryPlan[];
}

export interface PodcastSearchTelemetry {
  providers_called: string[];
  tms_per_provider: Record<string, number>;
  cache_hits?: string[];
  decision_mode: 'auto_select' | 'disambiguate';
  confidence: number;
  episodes_fetched?: number;
  episodes_with_chapters?: number;
  episodes_with_transcripts?: number;
  spotify_enrichment_applied?: boolean;
}

export interface PodcastSearchResult {
  resolved: ResolvedPodcast;
  telemetry: PodcastSearchTelemetry;
}

// Provider response shapes
export interface AppleSearchItem {
  collectionId: number;
  collectionName: string;
  artistName?: string;
  feedUrl?: string;
  artworkUrl100?: string;
  artworkUrl600?: string;
}

export interface AppleSearchRes {
  resultCount: number;
  results: AppleSearchItem[];
}

export interface PIShow {
  id: number; // feedId
  title: string;
  url: string; // feedUrl
  image?: string;
  itunesId?: number;
  author?: string;
  podcastGuid?: string;
}

export interface PIShowRes {
  status: string;
  feeds?: PIShow[];
  feed?: PIShow;
}

export interface PIEpisode {
  id: number;
  guid?: string;
  title: string;
  datePublished?: number; // epoch seconds
  enclosureUrl?: string;
  duration?: number;
  chaptersUrl?: string;
  transcripts?: Array<{ url: string; type?: string }>;
}

export interface PIEpisodesRes {
  items?: PIEpisode[];
  status?: string;
}

export interface PodcastIndexAuth {
  apiKey: string;
  apiSecret: string;
  userAgent?: string;
}

export interface ExecutionContext {
  podcastIndex?: PodcastIndexAuth;
  spotifyAccessToken?: string;
}

