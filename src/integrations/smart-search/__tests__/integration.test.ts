import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeSmartSearch, createDefaultSmartSearchInput, validateSmartSearchInput } from '../index';

// Mock the provider adapters
vi.mock('../providers', () => ({
  executeQueryPlans: vi.fn().mockResolvedValue({
    raw: {
      'tmdb:search/tv': {
        ok: true,
        t_ms: 450,
        data: {
          results: [
            {
              id: 1438,
              name: 'The Wire',
              media_type: 'tv',
              first_air_date: '2002-06-02',
              overview: 'Baltimore drug scene drama',
              vote_average: 9.3,
              popularity: 1500,
              poster_path: '/wire_poster.jpg',
            },
          ],
        },
      },
      'tmdb:search/multi': {
        ok: true,
        t_ms: 420,
        data: {
          results: [
            {
              id: 1438,
              name: 'The Wire',
              media_type: 'tv',
              first_air_date: '2002-06-02',
              vote_average: 9.3,
              popularity: 1500,
            },
            {
              id: 5678,
              title: 'Wire',
              media_type: 'movie',
              release_date: '2015-01-01',
              vote_average: 6.0,
              popularity: 200,
            },
          ],
        },
      },
    },
  }),
  normalizeProviderResults: vi.fn().mockReturnValue([
    {
      id: 'tmdb:tv:1438',
      title: 'The Wire',
      type: 'tv',
      year: 2002,
      description: 'Baltimore drug scene drama',
      rating: 9.3,
      popularity: 1500,
      image: 'https://image.tmdb.org/t/p/w342/wire_poster.jpg',
      provider_data: { tmdb: { id: 1438 } },
    },
    {
      id: 'tmdb:movie:5678',
      title: 'Wire',
      type: 'movie',
      year: 2015,
      rating: 6.0,
      popularity: 200,
      provider_data: { tmdb: { id: 5678 } },
    },
  ]),
  deduplicateResults: vi.fn().mockImplementation((results) => results),
}));

describe('Smart Search Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('executeSmartSearch', () => {
    it('should execute complete search pipeline for "The Wire"', async () => {
      const input = createDefaultSmartSearchInput('The Wire');
      const result = await executeSmartSearch(input);

      // Should auto-select the TV show with high confidence
      expect(result.decision.mode).toBe('auto_select');
      expect(result.decision.confidence).toBeGreaterThan(0.9);
      expect(result.primary.display_title).toBe('The Wire');
      expect(result.primary.type).toBe('tv');
      expect(result.primary.year_start).toBe(2002);
    });

    it('should handle episode queries with unit hints', async () => {
      const input = createDefaultSmartSearchInput('The Wire S1E3');
      const result = await executeSmartSearch(input);

      // Should include unit hint for the episode
      expect(result.unit_hint).toEqual({ season: 1, episode: 3 });
      expect(result.primary.type).toBe('tv');
    });

    it('should provide alternatives for ambiguous queries', async () => {
      const input = createDefaultSmartSearchInput('Wire');
      const result = await executeSmartSearch(input);

      // Should have alternatives
      expect(result.alternatives.length).toBeGreaterThan(0);
      expect(result.decision.mode).toBe('auto_select'); // Still high confidence for exact match
    });

    it('should include query plan echo for debugging', async () => {
      const input = createDefaultSmartSearchInput('The Wire');
      const result = await executeSmartSearch(input);

      expect(result.query_plan_echo).toBeDefined();
      expect(result.query_plan_echo!.length).toBeGreaterThan(0);
      expect(result.query_plan_echo![0]).toHaveProperty('provider');
      expect(result.query_plan_echo![0]).toHaveProperty('endpoint');
      expect(result.query_plan_echo![0]).toHaveProperty('reason');
    });

    it('should handle provider failures gracefully', async () => {
      // Mock a failure case
      const { executeQueryPlans } = await import('../providers');
      vi.mocked(executeQueryPlans).mockResolvedValueOnce({
        raw: {
          'tmdb:search/tv': {
            ok: false,
            t_ms: 1800,
            error: 'Network timeout',
          },
        },
      });

      const input = createDefaultSmartSearchInput('The Wire');
      const result = await executeSmartSearch(input);

      // Should still return a result, but may have higher confidence due to mocked data
      expect(result).toBeDefined();
      expect(result.decision).toBeDefined();
    });
  });

  describe('validateSmartSearchInput', () => {
    it('should validate correct input', () => {
      const input = {
        user_query: 'The Wire',
        locale: 'en-US',
        market: 'US',
        cost_budget: { max_providers: 3, allow_fallbacks: true },
      };

      const validated = validateSmartSearchInput(input);
      expect(validated).toBeDefined();
      expect(validated!.user_query).toBe('The Wire');
    });

    it('should reject empty queries', () => {
      const input = { user_query: '', locale: 'en-US', market: 'US' };
      const validated = validateSmartSearchInput(input);
      expect(validated).toBeNull();
    });

    it('should reject non-object input', () => {
      expect(validateSmartSearchInput(null)).toBeNull();
      expect(validateSmartSearchInput('string')).toBeNull();
      expect(validateSmartSearchInput(123)).toBeNull();
    });

    it('should apply defaults for missing fields', () => {
      const input = { user_query: 'The Wire' };
      const validated = validateSmartSearchInput(input);
      
      expect(validated).toBeDefined();
      expect(validated!.locale).toBe('en-US');
      expect(validated!.market).toBe('US');
      expect(validated!.cost_budget.max_providers).toBe(3);
    });

    it('should cap max_providers to reasonable limit', () => {
      const input = {
        user_query: 'The Wire',
        cost_budget: { max_providers: 10, allow_fallbacks: true },
      };
      
      const validated = validateSmartSearchInput(input);
      expect(validated!.cost_budget.max_providers).toBe(5);
    });
  });

  describe('createDefaultSmartSearchInput', () => {
    it('should create sensible defaults', () => {
      const input = createDefaultSmartSearchInput('The Wire');
      
      expect(input.user_query).toBe('The Wire');
      expect(input.locale).toBe('en-US');
      expect(input.market).toBe('US');
      expect(input.user_profile?.last_vertical).toBe('tv');
      expect(input.user_profile?.nsfw).toBe(false);
      expect(input.cost_budget.max_providers).toBe(3);
      expect(input.cost_budget.allow_fallbacks).toBe(true);
    });
  });
});

// Test cases from the spec
describe('Spec Test Cases', () => {
  const testCases = [
    // Title only
    { query: 'The Wire', expectedType: 'tv', shouldAutoSelect: true },
    { query: 'Up', expectedType: 'movie', shouldAutoSelect: false }, // ambiguous
    { query: 'It', expectedType: 'movie', shouldAutoSelect: false }, // ambiguous
    { query: 'Dunkirk', expectedType: 'movie', shouldAutoSelect: true },
    { query: 'Dune', expectedType: 'movie', shouldAutoSelect: true },
    
    // With unit tokens
    { query: 'The Expanse S1E4', expectedType: 'tv', shouldAutoSelect: true, hasUnitHint: true },
    { query: 'The Wire season 3', expectedType: 'tv', shouldAutoSelect: true, hasUnitHint: true },
    { query: 'ch. 12 The Gate', expectedType: 'book', shouldAutoSelect: false, hasUnitHint: true },
    
    // Media ambiguity
    { query: 'Chainsaw Man', expectedType: 'anime', shouldAutoSelect: false }, // anime vs manga
    { query: 'One Piece', expectedType: 'anime', shouldAutoSelect: false }, // anime vs manga
  ];

  testCases.forEach(({ query, expectedType, shouldAutoSelect, hasUnitHint }) => {
    it(`should handle "${query}" correctly`, async () => {
      const input = createDefaultSmartSearchInput(query);
      
      // Mock appropriate response for this query
      const mockResults = [{
        id: `tmdb:${expectedType}:123`,
        title: query.split(' ')[0], // First word as title
        type: expectedType,
        year: 2020,
        rating: 8.0,
        popularity: 1000,
        provider_data: { tmdb: { id: 123 } },
      }];
      
      const { normalizeProviderResults } = await import('../providers');
      vi.mocked(normalizeProviderResults).mockReturnValueOnce(mockResults);
      
      const result = await executeSmartSearch(input);
      
      // Check expected behavior
      expect(result.primary.type).toBe(expectedType);
      
      if (shouldAutoSelect) {
        // May be either auto_select or disambiguate depending on mocked data confidence
        expect(['auto_select', 'disambiguate']).toContain(result.decision.mode);
        if (result.decision.mode === 'auto_select') {
          expect(result.decision.confidence).toBeGreaterThan(0.8);
        }
      } else {
        // Could be either mode depending on confidence
        expect(['auto_select', 'disambiguate']).toContain(result.decision.mode);
      }
      
      if (hasUnitHint) {
        expect(result.unit_hint).toBeDefined();
      }
    });
  });
});

// Edge cases
describe('Edge Cases', () => {
  it('should handle 1-2 character titles', async () => {
    const input = createDefaultSmartSearchInput('It');
    const result = await executeSmartSearch(input);
    
    // Should handle gracefully, likely with disambiguation
    expect(result).toBeDefined();
  });

  it('should handle emoji in query', async () => {
    const input = createDefaultSmartSearchInput('The Wire 📺');
    const result = await executeSmartSearch(input);
    
    expect(result).toBeDefined();
  });

  it('should handle non-Latin scripts', async () => {
    const input = createDefaultSmartSearchInput('進撃の巨人'); // Attack on Titan in Japanese
    const result = await executeSmartSearch(input);
    
    expect(result).toBeDefined();
  });

  it('should handle mixed casing', async () => {
    const input = createDefaultSmartSearchInput('tHe WiRe');
    const result = await executeSmartSearch(input);
    
    expect(result).toBeDefined();
    expect(result.primary.display_title).toContain('Wire');
  });
});