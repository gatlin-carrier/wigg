import type { QueryPlan, ProviderResult, RawProviderResults } from './types';
import { searchMovies, searchMulti, getImageUrl } from '../tmdb/client';
import { searchBooks } from '../openlibrary/client';

// Provider adapter interface
export interface ProviderAdapter {
  name: string;
  execute: (plan: QueryPlan) => Promise<any>;
  normalize: (data: any) => NormalizedResult[];
}

// Normalized result format from all providers
export interface NormalizedResult {
  id: string;
  title: string;
  type: 'tv' | 'movie' | 'book' | 'anime' | 'manga' | 'podcast' | 'video' | 'game';
  year?: number;
  description?: string;
  image?: string;
  rating?: number;
  creators?: string[];
  genres?: string[];
  popularity?: number;
  language?: string;
  country?: string[];
  provider_data: Record<string, any>;
}

// TMDB Provider Adapter
export const tmdbAdapter: ProviderAdapter = {
  name: 'tmdb',
  
  async execute(plan: QueryPlan): Promise<any> {
    const { endpoint, params } = plan;
    
    switch (endpoint) {
      case 'search/movie':
        return await searchMovies(params.query, params.page || 1);
        
      case 'search/multi':
        return await searchMulti(params.query, params.page || 1);
        
      case 'search/tv':
        // Use multi search and filter for TV
        const multiResult = await searchMulti(params.query, params.page || 1);
        return {
          ...multiResult,
          results: multiResult.results.filter((r: any) => r.media_type === 'tv'),
        };
        
      default:
        throw new Error(`Unsupported TMDB endpoint: ${endpoint}`);
    }
  },
  
  normalize(data: any): NormalizedResult[] {
    if (!data?.results) return [];
    
    return data.results.map((item: any) => {
      const isTV = item.media_type === 'tv' || item.name;
      const isAnime = isAnimeTMDB(item);
      
      return {
        id: `tmdb:${item.media_type || 'movie'}:${item.id}`,
        title: item.title || item.name || 'Untitled',
        type: isAnime ? 'anime' : (isTV ? 'tv' : 'movie'),
        year: extractYear(item.release_date || item.first_air_date),
        description: item.overview,
        image: item.poster_path ? getImageUrl(item.poster_path) : undefined,
        rating: item.vote_average,
        genres: item.genre_ids || [],
        popularity: item.popularity,
        language: item.original_language,
        country: item.origin_country || [],
        provider_data: { tmdb: { id: item.id, media_type: item.media_type } },
      };
    });
  },
};

// OpenLibrary Provider Adapter
export const openLibraryAdapter: ProviderAdapter = {
  name: 'openlibrary',
  
  async execute(plan: QueryPlan): Promise<any> {
    const { params } = plan;
    return await searchBooks(params.q, params.limit || 20);
  },
  
  normalize(data: any): NormalizedResult[] {
    if (!Array.isArray(data)) return [];
    
    return data.map((book: any) => ({
      id: `openlibrary:book:${book.id}`,
      title: book.title,
      type: 'book' as const,
      year: book.year,
      description: book.summary || book.genre,
      image: book.cover_url,
      creators: book.author ? [book.author] : [],
      genres: book.genre ? [book.genre] : [],
      provider_data: { openlibrary: { key: book.id } },
    }));
  },
};

// Placeholder adapters for future providers
export const anilistAdapter: ProviderAdapter = {
  name: 'anilist',
  
  async execute(plan: QueryPlan): Promise<any> {
    // TODO: Implement AniList GraphQL integration
    throw new Error('AniList adapter not implemented');
  },
  
  normalize(data: any): NormalizedResult[] {
    return [];
  },
};

export const podcastIndexAdapter: ProviderAdapter = {
  name: 'podcastindex',
  
  async execute(plan: QueryPlan): Promise<any> {
    // TODO: Implement PodcastIndex API integration
    throw new Error('PodcastIndex adapter not implemented');
  },
  
  normalize(data: any): NormalizedResult[] {
    return [];
  },
};

export const igdbAdapter: ProviderAdapter = {
  name: 'igdb',
  
  async execute(plan: QueryPlan): Promise<any> {
    // TODO: Use existing Supabase function for games
    throw new Error('IGDB adapter not implemented');
  },
  
  normalize(data: any): NormalizedResult[] {
    return [];
  },
};

// Provider registry
export const PROVIDER_ADAPTERS: Record<string, ProviderAdapter> = {
  tmdb: tmdbAdapter,
  openlibrary: openLibraryAdapter,
  anilist: anilistAdapter,
  podcastindex: podcastIndexAdapter,
  igdb: igdbAdapter,
};

// Execute query plans against providers
export async function executeQueryPlans(plans: QueryPlan[]): Promise<RawProviderResults> {
  const results: Record<string, ProviderResult> = {};
  
  // Execute all plans in parallel
  const promises = plans.map(async (plan) => {
    const key = `${plan.provider}:${plan.endpoint}`;
    const startTime = performance.now();
    
    try {
      const adapter = PROVIDER_ADAPTERS[plan.provider];
      if (!adapter) {
        throw new Error(`Unknown provider: ${plan.provider}`);
      }
      
      const data = await Promise.race([
        adapter.execute(plan),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), plan.timeout_ms)
        ),
      ]);
      
      results[key] = {
        ok: true,
        t_ms: Math.round(performance.now() - startTime),
        data,
      };
    } catch (error) {
      results[key] = {
        ok: false,
        t_ms: Math.round(performance.now() - startTime),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
  
  await Promise.allSettled(promises);
  
  return { raw: results };
}

// Normalize all provider results
export function normalizeProviderResults(
  results: RawProviderResults,
  plans: QueryPlan[]
): NormalizedResult[] {
  const normalized: NormalizedResult[] = [];
  
  for (const plan of plans) {
    const key = `${plan.provider}:${plan.endpoint}`;
    const result = results.raw[key];
    
    if (result?.ok && result.data) {
      try {
        const adapter = PROVIDER_ADAPTERS[plan.provider];
        if (adapter) {
          const items = adapter.normalize(result.data);
          normalized.push(...items);
        }
      } catch (error) {
        console.warn(`Failed to normalize ${key}:`, error);
      }
    }
  }
  
  return normalized;
}

// Helper functions
function extractYear(dateString?: string): number | undefined {
  if (!dateString) return undefined;
  const year = parseInt(dateString.slice(0, 4));
  return isNaN(year) ? undefined : year;
}

function isAnimeTMDB(item: any): boolean {
  const genres: number[] = item.genre_ids || [];
  const lang = (item.original_language || '').toLowerCase();
  const countries: string[] = item.origin_country || [];
  
  // Animation genre + Japanese origin
  const isAnimation = genres.includes(16); // TMDB Animation genre ID
  const isJapanese = lang === 'ja' || countries.includes('JP');
  
  return isAnimation && isJapanese;
}