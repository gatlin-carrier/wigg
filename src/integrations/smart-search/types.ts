// Smart Search Types - LLM-powered search system
export type MediaType = 'tv' | 'movie' | 'book' | 'anime' | 'manga' | 'podcast' | 'video' | 'game';

export interface UserProfile {
  last_vertical?: MediaType;
  nsfw?: boolean;
}

export interface CostBudget {
  max_providers: number;
  allow_fallbacks: boolean;
}

export interface SmartSearchInput {
  user_query: string;
  locale: string;
  market: string;
  user_profile?: UserProfile;
  cost_budget: CostBudget;
}

// Phase 1: Query Planning
export interface QueryPlan {
  provider: string;
  endpoint: string;
  params: Record<string, any>;
  weight: number;
  reason: string;
  timeout_ms: number;
}

export interface QueryPlanResponse {
  plans: QueryPlan[];
}

// Phase 2: Entity Resolution
export interface EntityCard {
  title_id: string; // Format: "provider:type:id" e.g. "tmdb:tv:1438"
  display_title: string;
  type: MediaType;
  year_start?: number;
  confidence?: number;
  providers: Record<string, { id: string | number } | null>;
}

export interface SearchDecision {
  mode: 'auto_select' | 'disambiguate';
  confidence: number;
  why: string[];
}

export interface ResolvedSearch {
  decision: SearchDecision;
  primary: EntityCard;
  alternatives: EntityCard[];
  query_plan_echo?: QueryPlan[];
  unit_hint?: {
    season?: number;
    episode?: number;
    chapter?: number;
    volume?: number;
  };
}

// Provider Results
export interface ProviderResult {
  ok: boolean;
  t_ms: number;
  data?: any;
  error?: string;
}

export interface RawProviderResults {
  raw: Record<string, ProviderResult>;
}

// UI State
export interface SmartSearchState {
  query: string;
  isLoading: boolean;
  error?: string;
  resolved?: ResolvedSearch;
  selectedTitle?: string;
  predictedTypes: Array<{ type: MediaType; probability: number }>;
}

// Telemetry
export interface SearchTelemetry {
  time_to_first_plan_ms: number;
  time_to_resolve_ms: number;
  providers_called: string[];
  api_errors: string[];
  decision_mode: 'auto_select' | 'disambiguate';
  confidence: number;
  user_refined_via_chip?: boolean;
  wrong_vertical_feedback?: boolean;
}