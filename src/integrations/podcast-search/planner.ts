import type { PodcastSearchInput, QueryPlan } from './types';

// Helpers to detect inputs
const APPLE_SHOW_URL = /itunes\.apple\.com\/.*\/podcast\/.*\/id(\d+)/i;
const APPLE_PODCASTS_URL = /podcasts\.apple\.com\/.*\/id(\d+)/i;
const RSS_URL = /^(https?:)\/\/.+\.(xml|rss)(\?.*)?$/i;
const URLish = /^(https?:)\/\//i;
const NUMERIC = /^\d{6,}$/;
const EP_HINT = /(\bep\b|episode|ep\s*#?\d+|\bep\.?\s*\d+)/i;

export interface PlanFlags {
  needEpisodes: boolean;
}

export function planPodcastQuery(input: PodcastSearchInput): { plans: QueryPlan[]; flags: PlanFlags } {
  const { user_query, market, user_profile, cost_budget } = input;

  const plans: QueryPlan[] = [];
  const flags: PlanFlags = { needEpisodes: false };

  const trimmed = user_query.trim();
  const isNumericAppleId = NUMERIC.test(trimmed);
  const appleUrlMatch = trimmed.match(APPLE_SHOW_URL) || trimmed.match(APPLE_PODCASTS_URL);
  const isUrl = URLish.test(trimmed);
  const isRss = RSS_URL.test(trimmed);
  const episodeIntent = EP_HINT.test(trimmed);

  // Episode intent toggles episode fetch after show resolution
  flags.needEpisodes = episodeIntent;

  // Primary routing per spec
  if (isNumericAppleId) {
    // Directly resolve with PodcastIndex by iTunes id
    plans.push({
      provider: 'podcastindex',
      endpoint: 'podcasts/byitunesid',
      params: { id: trimmed },
      weight: 1.0,
      reason: 'Numeric Apple ID input',
      timeout_ms: 1800,
    });
  } else if (isUrl) {
    if (isRss) {
      plans.push({
        provider: 'podcastindex',
        endpoint: 'podcasts/byfeedurl',
        params: { url: trimmed },
        weight: 1.0,
        reason: 'RSS URL normalization',
        timeout_ms: 1800,
      });
    } else if (appleUrlMatch) {
      const collectionId = appleUrlMatch[1];
      plans.push({
        provider: 'podcastindex',
        endpoint: 'podcasts/byitunesid',
        params: { id: collectionId },
        weight: 1.0,
        reason: 'Apple show URL normalization',
        timeout_ms: 1800,
      });
    } else {
      // Unknown URL; fallback to Apple search with the URL as term (low weight)
      plans.push({
        provider: 'apple',
        endpoint: 'search',
        params: { term: trimmed, media: 'podcast', limit: 5, country: market },
        weight: 0.5,
        reason: 'Unknown URL; attempt discovery',
        timeout_ms: 1800,
      });
    }
  } else {
    // Default discovery via Apple Search
    plans.push({
      provider: 'apple',
      endpoint: 'search',
      params: { term: trimmed, media: 'podcast', limit: 5, country: market },
      weight: 1.0,
      reason: 'Primary show discovery',
      timeout_ms: 1800,
    });
  }

  // Conditional PodcastIndex enrichment from Apple top hit (feed recovery + canonical IDs)
  // Implemented by the resolver/executor by checking presence of apple result
  if (!isNumericAppleId && !isRss) {
    // Defer: only if apple.topHit.collectionId exists
    plans.push({
      provider: 'podcastindex',
      endpoint: 'podcasts/byitunesid',
      params: { idFrom: '<from apple.collectionId>' },
      weight: 0.9,
      reason: 'Recover feedUrl + canonical IDs',
      timeout_ms: 1800,
      only_if: 'apple.topHit.collectionId exists',
    });
  }

  // Episodes fetch (defer behind needEpisodes flag and budget/allow_fallbacks)
  if (flags.needEpisodes && cost_budget.allow_fallbacks) {
    plans.push({
      provider: 'podcastindex',
      endpoint: 'episodes/byfeedid',
      params: { feedidFrom: '<from podcastindex.feedId>', max: 20 },
      weight: 0.8,
      reason: 'Episode list for ranking',
      timeout_ms: 2000,
      only_if: 'needEpisodes',
    });
  }

  // Optional Spotify enrichment for signed-in users
  if (user_profile?.spotify_connected) {
    plans.push({
      provider: 'spotify',
      endpoint: 'me/shows',
      params: { limit: 20 },
      weight: 0.4,
      reason: 'Mark followed shows',
      timeout_ms: 1500,
      only_if: 'user_profile.spotify_connected',
    });
  }

  // Respect cost budget (sorted by weight)
  const sliced = plans.sort((a, b) => b.weight - a.weight).slice(0, input.cost_budget.max_providers);
  return { plans: sliced, flags };
}

