import { useQuery, useMutation } from '@tanstack/react-query';
import { useCallback, useState, useEffect } from 'react';
import type { SmartSearchInput, ResolvedSearch } from './types';
import { supabase } from '../supabase/client';

// Debounce hook
export function useDebounced<T>(value: T, delay = 350): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Smart search hook using Supabase Edge Function
export function useSmartSearch(input: SmartSearchInput, enabled = true) {
  const debouncedQuery = useDebounced(input.user_query, 350);
  
  return useQuery({
    queryKey: ['smart-search', debouncedQuery, input.locale, input.market],
    queryFn: async (): Promise<ResolvedSearch> => {
      if (!debouncedQuery.trim()) {
        throw new Error('Query is required');
      }

      const { data, error } = await supabase.functions.invoke('smart-search', {
        body: { ...input, user_query: debouncedQuery },
      });

      if (error) {
        throw new Error(error.message || 'Smart search failed');
      }

      return data as ResolvedSearch;
    },
    enabled: enabled && debouncedQuery.trim().length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
}

// Search state management hook
export function useSmartSearchState() {
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [userProfile] = useState({ last_vertical: 'tv' as const, nsfw: false });
  
  const searchInput: SmartSearchInput = {
    user_query: query,
    locale: 'en-US',
    market: 'US',
    user_profile: userProfile,
    cost_budget: {
      max_providers: 3,
      allow_fallbacks: true,
    },
  };
  
  const { data: resolved, isLoading, error } = useSmartSearch(
    searchInput, 
    query.trim().length > 0
  );
  
  // Auto-select logic
  const handleAutoSelect = useCallback((entityId: string, title: string) => {
    console.log('Auto-selected:', { entityId, title });
    // TODO: Update application state with selected media
  }, []);
  
  // Manual selection from disambiguation chips
  const handleManualSelect = useCallback((entityId: string, title: string) => {
    console.log('Manually selected:', { entityId, title });
    // TODO: Update application state with selected media
  }, []);
  
  // Type chip selection (for filtering/re-search)
  const handleTypeSelect = useCallback((type: string) => {
    setSelectedType(type);
    // TODO: Re-trigger search with type filter
  }, []);
  
  return {
    query,
    setQuery,
    selectedType,
    setSelectedType,
    resolved,
    isLoading,
    error,
    handleAutoSelect,
    handleManualSelect,
    handleTypeSelect,
  };
}

// Search telemetry hook
export function useSearchTelemetry() {
  const telemetryMutation = useMutation({
    mutationFn: async (telemetry: Record<string, any>) => {
      // TODO: Send to analytics service
      console.log('Search telemetry:', telemetry);
    },
  });
  
  const trackSearch = useCallback((data: {
    query: string;
    decision_mode: 'auto_select' | 'disambiguate';
    confidence: number;
    time_to_resolve_ms: number;
    providers_called: string[];
    user_refined_via_chip?: boolean;
  }) => {
    telemetryMutation.mutate(data);
  }, [telemetryMutation]);
  
  return { trackSearch };
}
