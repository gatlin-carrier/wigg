// Smart Search - LLM-powered media search system
// Main orchestrator for the Plan+Resolve architecture

import type { 
  SmartSearchInput, 
  QueryPlanResponse, 
  RawProviderResults, 
  ResolvedSearch,
  SearchTelemetry 
} from './types';
import { generateQueryPlans, extractEpisodeInfo, extractChapterInfo } from './planning';
import { executeQueryPlans, normalizeProviderResults } from './providers';
import { deduplicateResults } from './resolution';
import { resolveSearch } from './resolution';
import { predictMediaType } from './planning';

/**
 * Main Smart Search function - implements the Plan+Resolve mode
 * This function orchestrates the entire smart search pipeline:
 * 1. Generate query plans based on input analysis
 * 2. Execute plans against providers
 * 3. Normalize and deduplicate results
 * 4. Resolve to final entity with confidence scoring
 */
export async function executeSmartSearch(input: SmartSearchInput): Promise<ResolvedSearch> {
  const startTime = performance.now();
  const telemetry: Partial<SearchTelemetry> = {
    providers_called: [],
    api_errors: [],
  };
  
  try {
    // Phase 1: Query Planning
    console.log(`[SmartSearch] Planning for query: "${input.user_query}"`);
    
    const plans = generateQueryPlans(input);
    const planResponse: QueryPlanResponse = { plans };
    
    telemetry.time_to_first_plan_ms = Math.round(performance.now() - startTime);
    telemetry.providers_called = plans.map(p => p.provider);
    
    console.log(`[SmartSearch] Generated ${plans.length} query plans:`, 
      plans.map(p => `${p.provider}:${p.endpoint} (${p.reason})`));
    
    if (plans.length === 0) {
      return createEmptyResolvedSearch(input.user_query, 'No providers available');
    }
    
    // Phase 2: Execute Query Plans
    console.log(`[SmartSearch] Executing ${plans.length} provider calls...`);
    const providerResults = await executeQueryPlans(plans);
    
    // Track API errors
    Object.entries(providerResults.raw).forEach(([key, result]) => {
      if (!result.ok && result.error) {
        telemetry.api_errors?.push(`${key}: ${result.error}`);
      }
    });
    
    console.log(`[SmartSearch] Provider results:`, 
      Object.entries(providerResults.raw).map(([k, r]) => `${k}: ${r.ok ? 'OK' : r.error}`));
    
    // Phase 3: Normalize and Deduplicate Results
    const normalizedResults = normalizeProviderResults(providerResults, plans);
    const dedupedResults = deduplicateResults(normalizedResults);
    
    console.log(`[SmartSearch] Normalized ${normalizedResults.length} results, deduped to ${dedupedResults.length}`);
    
    // Phase 4: Entity Resolution
    const predictedTypes = predictMediaType(input.user_query, input.user_profile);
    const primaryType = predictedTypes[0] || 'movie';
    
    const resolved = resolveSearch(dedupedResults, input.user_query, primaryType, input.user_profile);
    
    // Add query plan echo for debugging
    resolved.query_plan_echo = plans;
    
    // Extract unit hints if present
    const episodeInfo = extractEpisodeInfo(input.user_query);
    const chapterInfo = extractChapterInfo(input.user_query);
    
    if (episodeInfo || chapterInfo) {
      resolved.unit_hint = { ...episodeInfo, ...chapterInfo };
    }
    
    // Complete telemetry
    telemetry.time_to_resolve_ms = Math.round(performance.now() - startTime);
    telemetry.decision_mode = resolved.decision.mode;
    telemetry.confidence = resolved.decision.confidence;
    
    console.log(`[SmartSearch] Resolved with ${resolved.decision.mode} (confidence: ${resolved.decision.confidence.toFixed(2)})`);
    console.log(`[SmartSearch] Primary result: ${resolved.primary.display_title} (${resolved.primary.type})`);
    
    return resolved;
    
  } catch (error) {
    console.error('[SmartSearch] Error during execution:', error);
    telemetry.time_to_resolve_ms = Math.round(performance.now() - startTime);
    
    return createEmptyResolvedSearch(
      input.user_query, 
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Create an empty resolved search for error cases
 */
function createEmptyResolvedSearch(query: string, reason: string): ResolvedSearch {
  return {
    decision: {
      mode: 'disambiguate',
      confidence: 0.0,
      why: [reason],
    },
    primary: {
      title_id: `empty:unknown:${Date.now()}`,
      display_title: query,
      type: 'movie',
      providers: {},
    },
    alternatives: [],
  };
}

/**
 * Validate smart search input
 */
export function validateSmartSearchInput(input: any): SmartSearchInput | null {
  if (!input || typeof input !== 'object') return null;
  
  const { user_query, locale = 'en-US', market = 'US' } = input;
  
  if (!user_query || typeof user_query !== 'string' || !user_query.trim()) {
    return null;
  }
  
  const validated: SmartSearchInput = {
    user_query: user_query.trim(),
    locale,
    market,
    user_profile: input.user_profile || { nsfw: false },
    cost_budget: {
      max_providers: Math.min(input.cost_budget?.max_providers || 3, 5),
      allow_fallbacks: input.cost_budget?.allow_fallbacks ?? true,
    },
  };
  
  return validated;
}

/**
 * Create default smart search input for testing
 */
export function createDefaultSmartSearchInput(query: string): SmartSearchInput {
  return {
    user_query: query,
    locale: 'en-US',
    market: 'US',
    user_profile: { 
      last_vertical: 'tv', 
      nsfw: false 
    },
    cost_budget: {
      max_providers: 3,
      allow_fallbacks: true,
    },
  };
}

// Re-export key types and functions for easy importing
export type {
  SmartSearchInput,
  ResolvedSearch,
  EntityCard,
  QueryPlan,
  MediaType,
  SearchTelemetry,
} from './types';

export {
  useSmartSearch,
  useSmartSearchState,
  useSearchTelemetry,
} from './hooks';

export { default as SmartSearchBar } from '@/components/search/SmartSearchBar';