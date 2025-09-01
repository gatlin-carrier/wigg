# WIGG Smart Search Implementation

This document describes the implementation of WIGG's LLM-powered smart media search system that eliminates the need for users to pre-select media type chips.

## Overview

The Smart Search system implements a **Plan+Resolve** architecture that:
1. Analyzes user queries to generate optimal provider search plans
2. Executes searches across multiple media providers in parallel
3. Uses sophisticated entity resolution to find the best matches
4. Auto-selects high-confidence results or presents disambiguation options

## Key Features

- **Intelligent Query Routing**: Detects episode tokens, media type hints, and user preferences
- **Multi-Provider Integration**: TMDB, OpenLibrary, with extensible architecture for more
- **Fuzzy Matching**: Advanced string similarity for handling typos and variations
- **Auto-Selection**: High-confidence matches are selected automatically
- **Disambiguation**: Multiple good matches presented as selectable chips
- **Unit Hints**: Episode numbers, seasons, chapters automatically extracted
- **Error Recovery**: Graceful handling of provider failures and timeouts
- **Telemetry**: Comprehensive analytics for search performance optimization

## Architecture

### Core Components

```typescript
// Main entry point
import { SmartSearchBar, useSmartSearch } from '@/integrations/smart-search';

// Types
import type { 
  SmartSearchInput, 
  ResolvedSearch, 
  EntityCard 
} from '@/integrations/smart-search/types';
```

### File Structure

```
src/integrations/smart-search/
├── index.ts                 # Main exports and orchestrator
├── types.ts                 # TypeScript type definitions
├── planning.ts              # Query analysis and plan generation
├── providers.ts             # Provider adapters and execution
├── resolution.ts            # Entity resolution and scoring
├── hooks.ts                 # React hooks for state management
├── telemetry.ts             # Error handling and analytics
└── __tests__/               # Comprehensive test suite
    ├── planning.test.ts
    ├── resolution.test.ts
    └── integration.test.ts

components/search/
├── SmartSearchBar.tsx       # Main UI component
└── HeaderSearch.tsx         # Existing header search (unchanged)

supabase/functions/
└── smart-search/
    └── index.ts             # Edge function for LLM processing
```

## Usage

### Basic Implementation

```typescript
import { SmartSearchBar } from '@/integrations/smart-search';

export default function SearchPage() {
  const handleSelection = (entity: EntityCard) => {
    // Handle selected media entity
    console.log('Selected:', entity.display_title, entity.type);
    
    // Update application state
    setSelectedMedia({
      id: entity.title_id,
      title: entity.display_title,
      type: entity.type,
      year: entity.year_start,
    });
  };

  return (
    <SmartSearchBar 
      onSelection={handleSelection}
      placeholder="Search movies, TV, books..."
      autoFocus
    />
  );
}
```

### Advanced Usage with Hooks

```typescript
import { useSmartSearchState } from '@/integrations/smart-search';

export default function AdvancedSearch() {
  const {
    query,
    setQuery,
    resolved,
    isLoading,
    error,
    handleAutoSelect,
    handleManualSelect,
  } = useSmartSearchState();

  return (
    <div>
      <input 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Enter search query..."
      />
      
      {isLoading && <div>Searching...</div>}
      
      {resolved?.decision.mode === 'auto_select' && (
        <div>Auto-selected: {resolved.primary.display_title}</div>
      )}
      
      {resolved?.decision.mode === 'disambiguate' && (
        <div>
          <p>Multiple matches found:</p>
          {[resolved.primary, ...resolved.alternatives].map(entity => (
            <button
              key={entity.title_id}
              onClick={() => handleManualSelect(entity.title_id, entity.display_title)}
            >
              {entity.display_title} ({entity.type})
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Configuration

### Environment Variables

```bash
# Required for TMDB integration
VITE_TMDB_API_KEY=your_tmdb_api_key

# Required for Supabase Edge Functions
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
```

### Provider Configuration

To add new providers, implement the `ProviderAdapter` interface:

```typescript
// src/integrations/smart-search/providers.ts
export const newProviderAdapter: ProviderAdapter = {
  name: 'new-provider',
  
  async execute(plan: QueryPlan): Promise<any> {
    // Call the provider's API
    const response = await fetch(plan.endpoint, {
      method: 'POST',
      body: JSON.stringify(plan.params),
    });
    return response.json();
  },
  
  normalize(data: any): NormalizedResult[] {
    // Convert provider's response to standard format
    return data.results.map(item => ({
      id: `new-provider:${item.type}:${item.id}`,
      title: item.title,
      type: item.type as MediaType,
      year: item.year,
      // ... other fields
      provider_data: { 'new-provider': { id: item.id } },
    }));
  },
};

// Register the provider
PROVIDER_ADAPTERS['new-provider'] = newProviderAdapter;
```

## Query Patterns and Routing

The system recognizes these query patterns and routes appropriately:

### Episode/TV Patterns
- `"The Wire S1E3"` → TV search with season 1, episode 3 hint
- `"Breaking Bad season 2 episode 5"` → TV search with season/episode hints
- `"Game of Thrones ep 9"` → TV search with episode hint

### Book Patterns
- `"Dune chapter 5"` → Book search with chapter hint
- `"Harry Potter vol. 2"` → Book search with volume hint
- `"ISBN 9780123456789"` → Book search by ISBN

### Anime/Manga Patterns
- `"Attack on Titan anime"` → Anime search
- `"One Piece manga"` → Manga search
- `"Chainsaw Man"` → Both anime and manga considered

### Ambiguous Queries
- Short titles like `"It"`, `"Up"` → Multi-provider search
- Generic terms → Type prediction based on user history

## Decision Logic

The system uses these confidence thresholds:

- **≥ 0.90**: Auto-select the top result
- **0.60–0.89**: Show disambiguation chips
- **< 0.60**: Request query refinement

### Scoring Algorithm

```typescript
score = 0.55 * exact_title_match
      + 0.15 * type_prior_match  
      + 0.15 * popularity_norm
      + 0.10 * year_reasonable
      + 0.05 * creator_overlap
      - penalties(mismatch, low_votes, duplicate)
```

## Testing

Run the comprehensive test suite:

```bash
# All smart search tests
npm run test -- src/integrations/smart-search

# Individual test files
npm run test -- src/integrations/smart-search/__tests__/planning.test.ts
npm run test -- src/integrations/smart-search/__tests__/resolution.test.ts
npm run test -- src/integrations/smart-search/__tests__/integration.test.ts
```

### Test Coverage

- **Query Planning**: 25+ tests covering token detection, type prediction, plan generation
- **Entity Resolution**: 20+ tests for fuzzy matching, scoring, deduplication
- **Integration**: 25+ tests with spec examples and edge cases
- **Edge Cases**: Special characters, emoji, non-Latin scripts, mixed casing

## Deployment

### Supabase Edge Function

Deploy the smart search function:

```bash
supabase functions deploy smart-search
```

### Environment Setup

The edge function requires:
- `TMDB_API_KEY` environment variable
- Access to OpenLibrary API (no key required)

## Performance Considerations

### Caching Strategy
- TanStack Query with 5-minute stale time for searches
- 10-minute cache for trending content
- 24-hour cache for genre mappings

### Cost Control
- Configurable `max_providers` limit (default: 3)
- Provider timeouts (1.8-2s per provider)
- Parallel execution of search plans
- Graceful degradation on failures

### Optimization Opportunities
- Add Redis caching for popular queries
- Implement search result prefetching
- Add CDN caching for provider responses
- Consider search result pagination for large result sets

## Monitoring and Analytics

The system tracks these metrics:

```typescript
interface SearchTelemetry {
  time_to_first_plan_ms: number;      // Planning performance
  time_to_resolve_ms: number;         // Total search time
  providers_called: string[];         // Which providers used
  api_errors: string[];              // Failed provider calls
  decision_mode: 'auto_select' | 'disambiguate';
  confidence: number;                 // Final confidence score
  user_refined_via_chip?: boolean;   // User clicked disambiguation
  wrong_vertical_feedback?: boolean;  // User reported wrong type
}
```

Analytics help optimize:
- Provider reliability and performance
- Query routing accuracy
- User experience patterns
- Cost efficiency

## Future Enhancements

### Planned Provider Integrations
- **AniList**: Comprehensive anime/manga database
- **PodcastIndex**: Open podcast search
- **IGDB**: Video game database (via existing Supabase function)
- **YouTube**: Video search integration
- **Spotify**: Music and podcast search

### Advanced Features
- **Voice Search**: Speech-to-text integration
- **Image Search**: Media poster/cover recognition
- **Recommendation Engine**: "More like this" suggestions
- **Collaborative Filtering**: User preference learning
- **Search History**: Personal search analytics

### Performance Improvements
- **Edge Caching**: CloudFlare or similar CDN integration
- **Search Suggestions**: Auto-complete as users type
- **Infinite Scroll**: Lazy loading of additional results
- **Background Sync**: Preload popular content

## Troubleshooting

### Common Issues

**Search returns no results:**
- Check TMDB API key configuration
- Verify Supabase function deployment
- Test individual provider endpoints

**High latency:**
- Monitor provider response times
- Check network connectivity
- Consider reducing `max_providers`

**Inaccurate results:**
- Review query routing logic
- Adjust scoring algorithm weights
- Add provider-specific normalization rules

**Type errors:**
- Ensure all provider data matches `NormalizedResult` interface
- Check TypeScript strict mode compatibility
- Verify all imports are correctly typed

### Debug Mode

Enable verbose logging:

```typescript
// Add to your environment
VITE_DEBUG_SMART_SEARCH=true

// Or programmatically
console.log('[SmartSearch] Debug enabled');
```

This logs detailed information about query planning, provider execution, and entity resolution.

## Contributing

When extending the smart search system:

1. **Follow the existing patterns** for provider adapters and normalization
2. **Write comprehensive tests** for new functionality
3. **Update types** to maintain TypeScript safety
4. **Document new query patterns** in routing logic
5. **Consider performance impact** of additional providers or complexity
6. **Add telemetry** for new features to monitor adoption and performance

The codebase uses modern React patterns, TypeScript strict mode, and follows the existing WIGG architecture conventions.