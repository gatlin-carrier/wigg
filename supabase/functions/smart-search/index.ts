import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Import smart search logic (these would need to be adapted for Deno)
// For now, we'll inline simplified versions of the core algorithms

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
  const hasManga = PATTERNS.manga.test(q);
  const hasPodcast = PATTERNS.podcast.test(q);
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
  
  // Anime / Manga routing via AniList
  if (hasAnime && plans.length < cost_budget.max_providers) {
    plans.push({
      provider: 'anilist',
      endpoint: 'search',
      params: { query: user_query, type: 'ANIME', perPage: 10 },
      weight: 1.4,
      reason: 'Anime tokens detected',
      timeout_ms: 2000,
    });
  }
  if (hasManga && plans.length < cost_budget.max_providers) {
    plans.push({
      provider: 'anilist',
      endpoint: 'search',
      params: { query: user_query, type: 'MANGA', perPage: 10 },
      weight: 1.4,
      reason: 'Manga tokens detected',
      timeout_ms: 2000,
    });
  }
  
  // Podcast routing via PodcastIndex
  if (hasPodcast && plans.length < cost_budget.max_providers) {
    plans.push({
      provider: 'podcastindex',
      endpoint: 'search/byterm',
      params: { q: user_query },
      weight: 1.3,
      reason: 'Podcast tokens detected',
      timeout_ms: 2000,
    });
  }

  // Games routing via IGDB
  if (hasGames && plans.length < cost_budget.max_providers) {
    plans.push({
      provider: 'igdb',
      endpoint: 'games',
      params: { query: user_query, limit: 10 },
      weight: 1.2,
      reason: 'Game tokens detected',
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
    } else if (plan.provider === 'anilist') {
      // GraphQL POST
      const gql = `
        query Search($search: String!, $type: MediaType, $perPage: Int){
          Page(page: 1, perPage: $perPage){
            media(search: $search, type: $type, isAdult:false){
              id
              title { romaji english native }
              coverImage { large extraLarge }
              bannerImage
              seasonYear
              startDate { year }
              averageScore
              popularity
              type
            }
          }
        }
      `;
      fetchOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          query: gql,
          variables: { search: plan.params.query, type: plan.params.type, perPage: Math.min(plan.params.perPage || 10, 25) },
        }),
      };
      url = 'https://graphql.anilist.co';
    } else if (plan.provider === 'podcastindex') {
      // PodcastIndex REST with HMAC auth
      const apiKey = Deno.env.get('PI_API_KEY') || Deno.env.get('VITE_PI_API_KEY');
      const apiSecret = Deno.env.get('PI_API_SECRET') || Deno.env.get('VITE_PI_API_SECRET');
      const userAgent = Deno.env.get('PODCAST_USER_AGENT') || Deno.env.get('VITE_PODCAST_USER_AGENT') || 'WIGG/SmartSearch (+https://wigg.app)';
      if (!apiKey || !apiSecret) throw new Error('PodcastIndex credentials not configured');
      const t = Math.floor(Date.now() / 1000);
      const auth = await sha1Hex(`${apiKey}${apiSecret}${t}`);
      const headers = {
        'X-Auth-Date': String(t),
        'X-Auth-Key': apiKey,
        'Authorization': auth,
        'User-Agent': userAgent,
      } as HeadersInit;
      const base = 'https://api.podcastindex.org/api/1.0';
      const p = new URLSearchParams({ q: plan.params.q || plan.params.query || '' });
      url = `${base}/search/byterm?${p.toString()}`;
      fetchOptions = { method: 'GET', headers };
    } else if (plan.provider === 'igdb') {
      // IGDB search via Twitch OAuth
      const clientId = Deno.env.get('IGDB_CLIENT_ID');
      const clientSecret = Deno.env.get('IGDB_API_KEY');
      if (!clientId || !clientSecret) throw new Error('IGDB credentials not configured');
      const token = await getIgdbAccessToken(clientId, clientSecret);
      const limit = Math.min(parseInt(String(plan.params?.limit ?? '10')), 25) || 10;
      const q = String(plan.params?.query || '').replace(/"/g, '\\"');
      const body = `search "${q}"; fields id,name,first_release_date,total_rating,rating,cover.image_id,url; limit ${limit};`;
      url = 'https://api.igdb.com/v4/games';
      fetchOptions = {
        method: 'POST',
        headers: {
          'Client-ID': clientId,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'text/plain',
        },
        body,
      };
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

// Normalize AniList results
function normalizeAniListResults(data: any, requestedType: 'ANIME' | 'MANGA'): any[] {
  const items = data?.data?.Page?.media || [];
  return items.map((m: any) => {
    const title = m?.title?.english || m?.title?.romaji || m?.title?.native || 'Untitled';
    const year = m?.seasonYear || m?.startDate?.year;
    const img = m?.coverImage?.extraLarge || m?.coverImage?.large;
    return {
      id: `anilist:${requestedType === 'ANIME' ? 'anime' : 'manga'}:${m.id}`,
      title,
      type: requestedType === 'ANIME' ? 'anime' : 'manga',
      year,
      description: undefined,
      image: img,
      rating: typeof m?.averageScore === 'number' ? m.averageScore / 10 : undefined,
      popularity: m?.popularity,
      provider_data: { anilist: { id: m.id, type: requestedType } },
    };
  });
}

// Normalize PodcastIndex results
function normalizePodcastIndexResults(data: any): any[] {
  const feeds = data?.feeds || [];
  return feeds.slice(0, 12).map((f: any) => ({
    id: `pi:feed:${f.id}`,
    title: f.title || 'Untitled',
    type: 'podcast',
    year: undefined,
    description: f.description || undefined,
    image: f.image || undefined,
    popularity: f.subscribers || f.itunesId ? 500 : 0,
    provider_data: { podcastindex: { feedId: f.id, itunesId: f.itunesId } },
  }));
}

// Normalize IGDB results
function normalizeIGDBResults(items: any[]): any[] {
  const arr = Array.isArray(items) ? items : [];
  return arr.map((g: any) => {
    const year = typeof g?.first_release_date === 'number'
      ? new Date(g.first_release_date * 1000).getUTCFullYear()
      : undefined;
    const imageId = g?.cover?.image_id;
    const image = imageId ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${imageId}.jpg` : undefined;
    const rating = typeof g?.total_rating === 'number' ? g.total_rating / 10 : (typeof g?.rating === 'number' ? g.rating / 10 : undefined);
    return {
      id: `igdb:game:${g.id}`,
      title: g?.name || 'Untitled',
      type: 'game',
      year,
      image,
      rating,
      popularity: typeof g?.total_rating === 'number' ? g.total_rating : (typeof g?.rating === 'number' ? g.rating : 0),
      provider_data: { igdb: { id: g.id } },
    };
  });
}

// Minimal SHA-1 hex helper for PodcastIndex auth
async function sha1Hex(input: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-1', enc.encode(input));
  const bytes = new Uint8Array(buf);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Robust fuzzy matching utilities (Levenshtein + word overlap)
function normalizeTitle(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = i - 1;
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(
        dp[j] + 1,        // deletion
        dp[j - 1] + 1,    // insertion
        prev + cost       // substitution
      );
      prev = temp;
    }
  }
  return dp[n];
}

function fuzzyMatch(a: string, b: string): number {
  const s1 = normalizeTitle(a);
  const s2 = normalizeTitle(b);
  if (s1 === s2) return s1.length === 0 ? 0.0 : 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;

  const maxLen = Math.max(s1.length, s2.length);
  const dist = levenshtein(s1, s2);
  let sim = (maxLen - dist) / maxLen; // 0..1

  // Word overlap bonus (helps reordered/partial matches)
  const w1 = s1.split(/\s+/);
  const w2 = s2.split(/\s+/);
  const overlap = w1.filter(w => w.length > 1 && w2.includes(w)).length;
  const denom = Math.max(w1.length, w2.length, 1);
  const bonus = (overlap / denom) * 0.2;
  sim = Math.min(1.0, Math.max(0.0, sim + bonus));
  return sim;
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

// Simple in-memory cache for IGDB OAuth token
let IGDB_TOKEN_CACHE: { token: string; expiresAt: number } | null = null;

async function getIgdbAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const now = Date.now();
  if (IGDB_TOKEN_CACHE && IGDB_TOKEN_CACHE.expiresAt > now + 30_000) {
    return IGDB_TOKEN_CACHE.token;
  }
  const tokenUrl = new URL('https://id.twitch.tv/oauth2/token');
  tokenUrl.searchParams.set('client_id', clientId);
  tokenUrl.searchParams.set('client_secret', clientSecret);
  tokenUrl.searchParams.set('grant_type', 'client_credentials');
  const resp = await fetch(tokenUrl.toString(), { method: 'POST' });
  if (!resp.ok) throw new Error(`IGDB auth failed: ${resp.status}`);
  const json = await resp.json();
  const token = String(json.access_token || '');
  const expiresIn = Number(json.expires_in || 3600) * 1000;
  if (!token) throw new Error('IGDB auth missing access_token');
  IGDB_TOKEN_CACHE = { token, expiresAt: now + expiresIn };
  return token;
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
        } else if (plan.provider === 'anilist') {
          const requestedType = (plan.params?.type === 'MANGA' ? 'MANGA' : 'ANIME') as 'ANIME' | 'MANGA';
          normalized = normalizeAniListResults(result.data, requestedType);
        } else if (plan.provider === 'podcastindex') {
          normalized = normalizePodcastIndexResults(result.data);
        } else if (plan.provider === 'igdb') {
          normalized = normalizeIGDBResults(result.data);
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
