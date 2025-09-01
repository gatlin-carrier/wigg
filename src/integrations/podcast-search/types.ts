// Podcast Search — Types and Contracts (Plan → Execute → Resolve)

export type Provider = 'apple' | 'podcastindex' | 'spotify';

export interface UserProfile {
  nsfw?: boolean;
  spotify_connected?: boolean;
}

export interface CostBudget {
  max_providers: number; // cap number of provider calls per query
  allow_fallbacks: boolean; // allow conditional fallbacks when confidence is low
}

export interface PodcastSearchInput {
  user_query: string;
  locale: string; // e.g., "en-US"
  market: string; // e.g., "US" (Apple Search country)
  user_profile?: UserProfile;
  cost_budget: CostBudget;
}

// Phase 1: QueryPlan[]
export interface QueryPlan {
  provider: Provider;
  endpoint: string; // e.g., 'search', 'podcasts/byitunesid', 'episodes/byfeedid', 'me/shows'
  params: Record<string, any>;
  weight: number; // relative priority
  reason: string; // short explanation for telemetry/why
  timeout_ms: number; // per-call timeout
  only_if?: string; // optional condition hint (evaluated by planner/host)
}

export interface QueryPlanResponse {
  plans: QueryPlan[];
}

// Phase 2: ResolvedPodcast
export interface ResolvedPodcastDecision {
  mode: 'auto_select' | 'disambiguate';
  confidence: number; // 0..1
  why: string[]; // short bullets
}

export interface ResolvedArtwork {
  url: string;
}

export interface ResolvedEpisodeTranscript {
  source: 'podcastindex';
  url: string;
  type?: string; // e.g., 'text/vtt', 'application/json'
}

export interface ResolvedEpisodeChapters {
  source: 'podcastindex';
  url: string;
}

export interface ResolvedEpisode {
  id: string; // e.g., 'pi:episode:123456'
  title: string;
  pubDate?: string; // ISO date
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

export interface ResolvedPodcast {
  decision: ResolvedPodcastDecision;
  show: ResolvedShow;
  episodes?: ResolvedEpisode[];
  alternatives?: Array<{ title: string; appleId?: number; confidence: number; publisher?: string }>;
  query_plan_echo?: QueryPlan[];
}

// Raw provider result envelope
export interface ProviderResult<T = any> {
  ok: boolean;
  t_ms: number;
  data?: T;
  error?: string;
}

export interface RawResults {
  raw: Record<string, ProviderResult>;
}

// Execution context (host-only secrets)
export interface PodcastIndexAuth {
  apiKey: string;
  apiSecret: string;
  userAgent?: string; // default provided if not set
}

export interface ExecutionContext {
  podcastIndex?: PodcastIndexAuth; // required for any PI calls
  spotifyAccessToken?: string; // required if calling Spotify user endpoints
}

// Provider response types (minimal shapes we actually use)
export interface AppleSearchItem {
  collectionId: number; // Apple show ID
  collectionName: string; // Show title
  artistName?: string; // Publisher/artist
  feedUrl?: string; // sometimes missing
  artworkUrl100?: string; // 100x100
  artworkUrl600?: string; // 600x600 when available
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
  feed?: PIShow; // some endpoints return singular
}

export interface PIEpisode {
  id: number; // episodeId
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

