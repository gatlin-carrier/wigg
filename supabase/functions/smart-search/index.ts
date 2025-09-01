import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Import smart search logic (these would need to be adapted for Deno)
// For now, we'll inline simplified versions of the core algorithms

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Types (simplified versions from our TypeScript files)
interface QueryPlan {
  provider: string;
  endpoint: string;
  params: Record<string, any>;
  weight: number;
  reason: string;
  timeout_ms: number;
}

interface SmartSearchInput {
  user_query: string;
  locale: string;
  market: string;
  user_profile?: { last_vertical?: string; nsfw?: boolean };
  cost_budget: { max_providers: number; allow_fallbacks: boolean };
}

interface ResolvedSearch {
  decision: {
    mode: 'auto_select' | 'disambiguate';
    confidence: number;
    why: string[];
  };
  primary: {
    title_id: string;
    display_title: string;
    type: string;
    year_start?: number;
    confidence?: number;
    providers: Record<string, { id: string | number } | null>;
  };
  alternatives: Array<{
    title_id: string;
    display_title: string;
    type: string;
    year_start?: number;
    confidence?: number;
    providers: Record<string, { id: string | number } | null>;
  }>;
  query_plan_echo?: QueryPlan[];
}

// Token detection patterns
const PATTERNS = {
  episode: /S\d+E\d+|season\s*\d+\s*episode\s*\d+|ep\.?\s*\d+/i,
  bookish: /chapter|ch\.|vol\.|volume|isbn|page/i,
  anime: /anime|ova|ona/i,
  manga: /manga|manhwa|manhua/i,
  podcast: /podcast|episode\s*#?\d+/i,
  games: /game|gaming|steam|xbox|playstation|nintendo/i,
};

// Generate query plans based on input
function generateQueryPlans(input: SmartSearchInput): QueryPlan[] {
  const { user_query, locale, cost_budget } = input;
  const plans: QueryPlan[] = [];
  
  const q = user_query.toLowerCase();
  const hasEpisode = PATTERNS.episode.test(q);
  const hasBookish = PATTERNS.bookish.test(q);
  const hasAnime = PATTERNS.anime.test(q);
  const hasGames = PATTERNS.games.test(q);
  
  // Episode-specific routing
  if (hasEpisode) {
    plans.push({
      provider: 'tmdb',
      endpoint: 'search/tv',
      params: { query: user_query, language: locale },
      weight: 1.5,
      reason: 'Episode tokens detected',
      timeout_ms: 1800,
    });
  }
  
  // Book routing
  if (hasBookish || plans.length === 0) {
    plans.push({
      provider: 'openlibrary',
      endpoint: 'search',
      params: { q: user_query },
      weight: hasBookish ? 1.3 : 0.8,
      reason: hasBookish ? 'Book tokens detected' : 'Book fallback',
      timeout_ms: 2000,
    });
  }
  
  // Core TMDB routing
  if (!hasBookish && plans.length < cost_budget.max_providers) {
    plans.push({
      provider: 'tmdb',
      endpoint: 'search/multi',
      params: { query: user_query, language: locale },
      weight: 1.0,
      reason: 'Multi-search for alternatives',
      timeout_ms: 1800,
    });
  }
  
  return plans.slice(0, cost_budget.max_providers);
}

// Execute a single query plan
async function executeQueryPlan(plan: QueryPlan): Promise<{ ok: boolean; data?: any; error?: string; t_ms: number }> {
  const startTime = performance.now();
  
  try {
    let url: string;
    let fetchOptions: RequestInit = {};
    
    if (plan.provider === 'tmdb') {
      const tmdbKey = Deno.env.get('TMDB_API_KEY');
      if (!tmdbKey) throw new Error('TMDB_API_KEY not configured');
      
      const params = new URLSearchParams({
        api_key: tmdbKey,
        ...plan.params,
      });
      
      url = `https://api.themoviedb.org/3/${plan.endpoint}?${params.toString()}`;
    } else if (plan.provider === 'openlibrary') {
      const params = new URLSearchParams(plan.params);
      url = `https://openlibrary.org/search.json?${params.toString()}`;
    } else {
      throw new Error(`Unsupported provider: ${plan.provider}`);
    }
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), plan.timeout_ms);
    
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      
      if (!response.ok) {
        throw new Error(`${plan.provider} ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        ok: true,
        data,
        t_ms: Math.round(performance.now() - startTime),
      };
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      t_ms: Math.round(performance.now() - startTime),
    };
  }
}

// Normalize TMDB results
function normalizeTMDBResults(data: any): any[] {
  if (!data?.results) return [];
  
  return data.results.map((item: any) => {
    const isTV = item.media_type === 'tv' || item.name;
    return {
      id: `tmdb:${item.media_type || 'movie'}:${item.id}`,
      title: item.title || item.name || 'Untitled',
      type: isTV ? 'tv' : 'movie',
      year: extractYear(item.release_date || item.first_air_date),
      description: item.overview,
      image: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : undefined,
      rating: item.vote_average,
      popularity: item.popularity,
      provider_data: { tmdb: { id: item.id } },
    };
  });
}

// Normalize OpenLibrary results
function normalizeOpenLibraryResults(data: any): any[] {
  if (!data?.docs) return [];
  
  return data.docs.slice(0, 10).map((doc: any) => ({
    id: `openlibrary:book:${doc.key}`,
    title: doc.title || 'Untitled',
    type: 'book',
    year: doc.first_publish_year,
    description: doc.subtitle,
    authors: doc.author_name || [],
    provider_data: { openlibrary: { key: doc.key } },
  }));
}

// Simple fuzzy matching
function fuzzyMatch(a: string, b: string): number {
  const s1 = a.toLowerCase().replace(/[^\w]/g, '');
  const s2 = b.toLowerCase().replace(/[^\w]/g, '');
  
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;
  
  // Simple character overlap ratio
  const set1 = new Set(s1);
  const set2 = new Set(s2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

// Score and resolve results
function resolveResults(results: any[], query: string): ResolvedSearch {
  if (results.length === 0) {
    return {
      decision: { mode: 'disambiguate', confidence: 0.0, why: ['No results found'] },
      primary: {
        title_id: `empty:unknown:${Date.now()}`,
        display_title: query,
        type: 'movie',
        providers: {},
      },
      alternatives: [],
    };
  }
  
  // Score results
  const scored = results.map(result => ({
    ...result,
    score: fuzzyMatch(query, result.title) * 0.7 + 
           (result.popularity ? Math.min(result.popularity / 1000, 1.0) * 0.3 : 0),
  })).sort((a, b) => b.score - a.score);
  
  const top = scored[0];
  const alternatives = scored.slice(1, 3);
  
  const confidence = top.score;
  const mode = confidence >= 0.8 ? 'auto_select' : 'disambiguate';
  
  return {
    decision: {
      mode,
      confidence,
      why: confidence >= 0.8 ? ['High confidence match'] : ['Multiple possible matches'],
    },
    primary: {
      title_id: top.id,
      display_title: top.title,
      type: top.type,
      year_start: top.year,
      confidence: top.score,
      providers: top.provider_data,
    },
    alternatives: alternatives.map(alt => ({
      title_id: alt.id,
      display_title: alt.title,
      type: alt.type,
      year_start: alt.year,
      confidence: alt.score,
      providers: alt.provider_data,
    })),
  };
}

function extractYear(dateString?: string): number | undefined {
  if (!dateString) return undefined;
  const year = parseInt(dateString.slice(0, 4));
  return isNaN(year) ? undefined : year;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const input: SmartSearchInput = await req.json();
    const { user_query } = input;
    
    if (!user_query?.trim()) {
      throw new Error('user_query is required');
    }
    
    console.log(`Smart search for: "${user_query}"`);
    
    // Phase 1: Generate Query Plans
    const plans = generateQueryPlans(input);
    console.log(`Generated ${plans.length} query plans`);
    
    // Phase 2: Execute Plans
    const results = await Promise.all(
      plans.map(plan => executeQueryPlan(plan))
    );
    
    console.log(`Executed ${results.length} plans`);
    
    // Phase 3: Normalize Results
    const allResults: any[] = [];
    
    for (let i = 0; i < plans.length; i++) {
      const plan = plans[i];
      const result = results[i];
      
      if (result.ok && result.data) {
        let normalized: any[] = [];
        
        if (plan.provider === 'tmdb') {
          normalized = normalizeTMDBResults(result.data);
        } else if (plan.provider === 'openlibrary') {
          normalized = normalizeOpenLibraryResults(result.data);
        }
        
        allResults.push(...normalized);
      }
    }
    
    console.log(`Normalized ${allResults.length} total results`);
    
    // Phase 4: Resolve to Final Answer
    const resolved = resolveResults(allResults, user_query);
    resolved.query_plan_echo = plans;
    
    console.log(`Resolved with confidence ${resolved.decision.confidence}`);
    
    return new Response(JSON.stringify(resolved), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Smart search error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});