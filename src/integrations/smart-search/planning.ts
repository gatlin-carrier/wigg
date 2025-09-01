import type { QueryPlan, SmartSearchInput, MediaType } from './types';

// Token detection patterns for routing heuristics
const PATTERNS = {
  episode: /S\d+E\d+|season\s*\d+\s*episode\s*\d+|ep\.?\s*\d+/i,
  bookish: /chapter|ch\.|vol\.|volume|isbn|page/i,
  anime: /anime|ova|ona/i,
  manga: /manga|manhwa|manhua/i,
  podcast: /podcast|episode\s*#?\d+/i,
  youtube: /youtu\.?be|youtube\.com/i,
  twitch: /twitch\.tv/i,
  games: /game|gaming|steam|xbox|playstation|nintendo/i,
} as const;

// Stop words for query normalization
const STOP_WORDS = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an']);

export function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(word => word.length > 0 && !STOP_WORDS.has(word))
    .join(' ');
}

export function detectTokens(query: string): Record<string, boolean> {
  const q = query.toLowerCase();
  return {
    episode: PATTERNS.episode.test(q),
    bookish: PATTERNS.bookish.test(q),
    anime: PATTERNS.anime.test(q),
    manga: PATTERNS.manga.test(q),
    podcast: PATTERNS.podcast.test(q),
    youtube: PATTERNS.youtube.test(q),
    twitch: PATTERNS.twitch.test(q),
    games: PATTERNS.games.test(q),
  };
}

export function predictMediaType(query: string, userProfile?: { last_vertical?: MediaType }): MediaType[] {
  const tokens = detectTokens(query);
  const priorities: Array<{ type: MediaType; weight: number }> = [];
  
  // Strong token matches
  if (tokens.episode) priorities.push({ type: 'tv', weight: 1.5 });
  if (tokens.anime) priorities.push({ type: 'anime', weight: 1.4 });
  if (tokens.manga) priorities.push({ type: 'manga', weight: 1.4 });
  if (tokens.bookish) priorities.push({ type: 'book', weight: 1.3 });
  if (tokens.podcast) priorities.push({ type: 'podcast', weight: 1.3 });
  if (tokens.games) priorities.push({ type: 'game', weight: 1.2 });
  if (tokens.youtube) priorities.push({ type: 'video', weight: 1.1 });
  
  // Default priorities for ambiguous queries
  if (priorities.length === 0) {
    priorities.push(
      { type: 'tv', weight: 1.1 }, // Slight TV bias as per spec
      { type: 'movie', weight: 1.0 },
      { type: 'book', weight: 0.8 },
      { type: 'anime', weight: 0.7 },
    );
  }
  
  // User preference boost
  if (userProfile?.last_vertical) {
    const existing = priorities.find(p => p.type === userProfile.last_vertical);
    if (existing) {
      existing.weight += 0.1;
    } else {
      priorities.push({ type: userProfile.last_vertical, weight: 0.9 });
    }
  }
  
  return priorities
    .sort((a, b) => b.weight - a.weight)
    .map(p => p.type);
}

export function generateQueryPlans(input: SmartSearchInput): QueryPlan[] {
  const { user_query, locale, cost_budget, user_profile } = input;
  const tokens = detectTokens(user_query);
  const mediaPriorities = predictMediaType(user_query, user_profile);
  const plans: QueryPlan[] = [];
  
  const language = locale.split('-')[0]; // 'en-US' -> 'en'
  const isAmbiguous = user_query.length <= 3 || 
    ['it', 'up', 'her', 'him', 'they'].includes(user_query.toLowerCase());
  
  // Episode-specific routing
  if (tokens.episode) {
    plans.push({
      provider: 'tmdb',
      endpoint: 'search/tv',
      params: { query: user_query, language: locale },
      weight: 1.5,
      reason: 'Episode tokens detected',
      timeout_ms: 1800,
    });
  }
  
  // Anime/Manga routing
  if (tokens.anime || tokens.manga) {
    plans.push({
      provider: 'anilist',
      endpoint: 'search',
      params: { 
        query: user_query, 
        type: tokens.anime ? 'ANIME' : 'MANGA' 
      },
      weight: 1.4,
      reason: tokens.anime ? 'Anime tokens detected' : 'Manga tokens detected',
      timeout_ms: 2000,
    });
  }
  
  // Book routing
  if (tokens.bookish || mediaPriorities[0] === 'book') {
    plans.push({
      provider: 'openlibrary',
      endpoint: 'search',
      params: { q: user_query },
      weight: tokens.bookish ? 1.3 : 1.0,
      reason: tokens.bookish ? 'Book tokens detected' : 'Book priority',
      timeout_ms: 2000,
    });
  }
  
  // Podcast routing
  if (tokens.podcast) {
    plans.push({
      provider: 'podcastindex',
      endpoint: 'search/byterm',
      params: { q: user_query },
      weight: 1.3,
      reason: 'Podcast tokens detected',
      timeout_ms: 2000,
    });
  }
  
  // Games routing
  if (tokens.games || mediaPriorities[0] === 'game') {
    plans.push({
      provider: 'igdb',
      endpoint: 'games',
      params: { query: user_query },
      weight: tokens.games ? 1.2 : 0.8,
      reason: tokens.games ? 'Game tokens detected' : 'Game fallback',
      timeout_ms: 2000,
    });
  }
  
  // Core TMDB routing (movies/TV)
  if (!tokens.bookish && !tokens.podcast && !tokens.games) {
    // Primary search based on top media type
    if (mediaPriorities[0] === 'tv' || tokens.episode) {
      plans.push({
        provider: 'tmdb',
        endpoint: 'search/tv',
        params: { query: user_query, language: locale },
        weight: 1.1,
        reason: 'TV priority or episode context',
        timeout_ms: 1800,
      });
    } else if (mediaPriorities[0] === 'movie') {
      plans.push({
        provider: 'tmdb',
        endpoint: 'search/movie',
        params: { query: user_query, language: locale },
        weight: 1.1,
        reason: 'Movie priority',
        timeout_ms: 1800,
      });
    }
    
    // Multi-search for alternatives (unless very specific)
    if (!tokens.episode && plans.length < cost_budget.max_providers) {
      plans.push({
        provider: 'tmdb',
        endpoint: 'search/multi',
        params: { query: user_query, language: locale },
        weight: 0.9,
        reason: 'Surface alternative types',
        timeout_ms: 1800,
      });
    }
  }
  
  // Ambiguous query shotgun approach
  if (isAmbiguous && cost_budget.allow_fallbacks) {
    if (!plans.some(p => p.provider === 'tmdb')) {
      plans.push({
        provider: 'tmdb',
        endpoint: 'search/multi',
        params: { query: user_query, language: locale },
        weight: 1.0,
        reason: 'Ambiguous title shotgun',
        timeout_ms: 1800,
      });
    }
    
    if (!plans.some(p => p.provider === 'openlibrary') && plans.length < cost_budget.max_providers) {
      plans.push({
        provider: 'openlibrary',
        endpoint: 'search',
        params: { q: user_query },
        weight: 0.6,
        reason: 'Book fallback for ambiguous',
        timeout_ms: 2000,
      });
    }
  }
  
  // Respect cost budget
  return plans
    .sort((a, b) => b.weight - a.weight)
    .slice(0, cost_budget.max_providers);
}

export function extractEpisodeInfo(query: string): { season?: number; episode?: number } | null {
  // Match S1E3, Season 1 Episode 3, ep 3, season 3, etc.
  const patterns = [
    /S(\d+)E(\d+)/i,
    /season\s*(\d+)\s*episode\s*(\d+)/i,
    /season\s*(\d+)/i,
    /ep\.?\s*(\d+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match) {
      if (match.length === 3) {
        return { season: parseInt(match[1]), episode: parseInt(match[2]) };
      } else if (match.length === 2) {
        if (pattern.source.includes('season')) {
          return { season: parseInt(match[1]) };
        } else {
          return { episode: parseInt(match[1]) };
        }
      }
    }
  }
  
  return null;
}

export function extractChapterInfo(query: string): { chapter?: number; volume?: number } | null {
  const patterns = [
    /ch\.?\s*(\d+)/i,
    /chapter\s*(\d+)/i,
    /vol\.?\s*(\d+)/i,
    /volume\s*(\d+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match) {
      const num = parseInt(match[1]);
      if (pattern.source.includes('vol')) {
        return { volume: num };
      } else {
        return { chapter: num };
      }
    }
  }
  
  return null;
}