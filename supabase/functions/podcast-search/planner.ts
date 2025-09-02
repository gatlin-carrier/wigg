import type { PodcastSearchInput, QueryPlan } from './types.ts';

const APPLE_SHOW_URL = /itunes\.apple\.com\/.*\/podcast\/.*\/id(\d+)/i;
const APPLE_PODCASTS_URL = /podcasts\.apple\.com\/.*\/id(\d+)/i;
const RSS_URL = /^(https?:)\/\/.+\.(xml|rss)(\?.*)?$/i;
const URLish = /^(https?:)\/\//i;
const NUMERIC = /^\d{6,}$/;
const EP_HINT = /(\bep\b|episode|ep\s*#?\d+|\bep\.?\s*\d+)/i;

export interface PlanFlags { needEpisodes: boolean }

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

  flags.needEpisodes = episodeIntent;

  if (isNumericAppleId) {
    plans.push({
      provider: 'podcastindex', endpoint: 'podcasts/byitunesid', params: { id: trimmed }, weight: 1.0,
      reason: 'Numeric Apple ID input', timeout_ms: 1800,
    });
  } else if (isUrl) {
    if (isRss) {
      plans.push({ provider: 'podcastindex', endpoint: 'podcasts/byfeedurl', params: { url: trimmed }, weight: 1.0, reason: 'RSS URL normalization', timeout_ms: 1800 });
    } else if (appleUrlMatch) {
      const collectionId = appleUrlMatch[1];
      plans.push({ provider: 'podcastindex', endpoint: 'podcasts/byitunesid', params: { id: collectionId }, weight: 1.0, reason: 'Apple show URL normalization', timeout_ms: 1800 });
    } else {
      plans.push({ provider: 'apple', endpoint: 'search', params: { term: trimmed, media: 'podcast', limit: 5, country: market }, weight: 0.5, reason: 'Unknown URL; attempt discovery', timeout_ms: 1800 });
    }
  } else {
    plans.push({ provider: 'apple', endpoint: 'search', params: { term: trimmed, media: 'podcast', limit: 5, country: market }, weight: 1.0, reason: 'Primary show discovery', timeout_ms: 1800 });
  }

  if (!isNumericAppleId && !isRss) {
    plans.push({ provider: 'podcastindex', endpoint: 'podcasts/byitunesid', params: { idFrom: '<from apple.collectionId>' }, weight: 0.9, reason: 'Recover feedUrl + canonical IDs', timeout_ms: 1800, only_if: 'apple.topHit.collectionId exists' });
  }

  if (flags.needEpisodes && cost_budget.allow_fallbacks) {
    plans.push({ provider: 'podcastindex', endpoint: 'episodes/byfeedid', params: { feedidFrom: '<from podcastindex.feedId>', max: 20 }, weight: 0.8, reason: 'Episode list for ranking', timeout_ms: 2000, only_if: 'needEpisodes' });
  }

  if (user_profile?.spotify_connected) {
    plans.push({ provider: 'spotify', endpoint: 'me/shows', params: { limit: 20 }, weight: 0.4, reason: 'Mark followed shows', timeout_ms: 1500, only_if: 'user_profile.spotify_connected' });
  }

  const sliced = plans.sort((a, b) => b.weight - a.weight).slice(0, input.cost_budget.max_providers);
  return { plans: sliced, flags };
}

