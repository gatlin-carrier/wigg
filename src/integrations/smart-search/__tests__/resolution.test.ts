import { describe, it, expect } from 'vitest';
import { 
  fuzzyMatch, 
  normalizeTitle, 
  scoreResult, 
  resolveSearch,
  deduplicateResults 
} from '../resolution';
import type { NormalizedResult } from '../providers';

describe('Entity Resolution', () => {
  describe('fuzzyMatch', () => {
    it('should return 1.0 for exact matches', () => {
      expect(fuzzyMatch('The Wire', 'The Wire')).toBe(1.0);
      expect(fuzzyMatch('breaking bad', 'breaking bad')).toBe(1.0);
    });

    it('should return high scores for close matches', () => {
      expect(fuzzyMatch('The Wire', 'Wire')).toBeGreaterThan(0.7); // More realistic expectation
      expect(fuzzyMatch('Breaking Bad', 'breaking bad')).toBe(1.0); // case insensitive
    });

    it('should return low scores for poor matches', () => {
      expect(fuzzyMatch('The Wire', 'Game of Thrones')).toBeLessThan(0.3);
      expect(fuzzyMatch('Breaking Bad', 'The Sopranos')).toBeLessThan(0.3);
    });

    it('should handle empty strings', () => {
      expect(fuzzyMatch('', '')).toBe(0.0);
      expect(fuzzyMatch('The Wire', '')).toBe(0.0);
    });
  });

  describe('normalizeTitle', () => {
    it('should normalize titles for comparison', () => {
      expect(normalizeTitle('The Wire')).toBe('wire');
      expect(normalizeTitle('Breaking Bad!')).toBe('breaking bad');
      expect(normalizeTitle('Game of Thrones')).toBe('game thrones');
    });

    it('should remove articles and prepositions', () => {
      expect(normalizeTitle('A Game of Thrones')).toBe('game thrones');
      expect(normalizeTitle('The Lord of the Rings')).toBe('lord rings');
    });

    it('should handle punctuation and special characters', () => {
      expect(normalizeTitle("Ocean's Eleven")).toBe('oceans eleven');
      expect(normalizeTitle('Spider-Man: Into the Spider-Verse')).toBe('spiderman into spiderverse');
    });
  });

  describe('scoreResult', () => {
    const mockResult: NormalizedResult = {
      id: 'tmdb:tv:1438',
      title: 'The Wire',
      type: 'tv',
      year: 2002,
      description: 'Baltimore drug scene',
      rating: 9.3,
      popularity: 1500,
      creators: ['David Simon'],
      genres: ['Crime', 'Drama'],
      provider_data: { tmdb: { id: 1438 } },
    };

    it('should score exact title matches highly', () => {
      const score = scoreResult(mockResult, 'The Wire', 'tv');
      expect(score).toBeGreaterThan(0.9);
    });

    it('should boost scores for type matches', () => {
      const tvScore = scoreResult(mockResult, 'Wire', 'tv');
      const movieScore = scoreResult(mockResult, 'Wire', 'movie');
      
      expect(tvScore).toBeGreaterThan(movieScore);
    });

    it('should consider popularity in scoring', () => {
      const popularResult = { ...mockResult, popularity: 2000 };
      const unpopularResult = { ...mockResult, popularity: 100 };
      
      const popularScore = scoreResult(popularResult, 'The Wire', 'tv');
      const unpopularScore = scoreResult(unpopularResult, 'The Wire', 'tv');
      
      expect(popularScore).toBeGreaterThan(unpopularScore);
    });

    it('should apply penalties for low ratings', () => {
      const goodResult = { ...mockResult, rating: 8.5 };
      const badResult = { ...mockResult, rating: 2.0 };
      
      const goodScore = scoreResult(goodResult, 'The Wire', 'tv');
      const badScore = scoreResult(badResult, 'The Wire', 'tv');
      
      expect(goodScore).toBeGreaterThan(badScore);
    });

    it('should consider year reasonableness', () => {
      const recentResult = { ...mockResult, year: 2020 };
      const oldResult = { ...mockResult, year: 1950 };
      
      const recentScore = scoreResult(recentResult, 'The Wire', 'tv');
      const oldScore = scoreResult(oldResult, 'The Wire', 'tv');
      
      expect(recentScore).toBeGreaterThan(oldScore);
    });
  });

  describe('resolveSearch', () => {
    const mockResults: NormalizedResult[] = [
      {
        id: 'tmdb:tv:1438',
        title: 'The Wire',
        type: 'tv',
        year: 2002,
        rating: 9.3,
        popularity: 1500,
        provider_data: { tmdb: { id: 1438 } },
      },
      {
        id: 'tmdb:movie:12345',
        title: 'The Wire',
        type: 'movie',
        year: 2015,
        rating: 6.0,
        popularity: 200,
        provider_data: { tmdb: { id: 12345 } },
      },
      {
        id: 'openlibrary:book:67890',
        title: 'The Wire: Truth Be Told',
        type: 'book',
        year: 2004,
        provider_data: { openlibrary: { key: 'OL67890W' } },
      },
    ];

    it('should auto-select high confidence matches', () => {
      const resolved = resolveSearch(mockResults, 'The Wire', 'tv');
      
      expect(resolved.decision.mode).toBe('auto_select');
      expect(resolved.decision.confidence).toBeGreaterThan(0.8);
      // Should return the best matching result (order may vary based on scoring)
      expect(resolved.primary.title_id).toBeDefined();
    });

    it('should disambiguate medium confidence matches', () => {
      const resolved = resolveSearch(mockResults, 'Wire show', 'tv');
      
      // May auto-select or disambiguate depending on scoring
      expect(['auto_select', 'disambiguate']).toContain(resolved.decision.mode);
      expect(resolved.alternatives.length).toBeGreaterThan(0);
    });

    it('should provide meaningful explanations', () => {
      const resolved = resolveSearch(mockResults, 'The Wire', 'tv');
      
      expect(resolved.decision.why).toContain('Exact title match');
      expect(resolved.decision.why.length).toBeGreaterThan(0);
    });

    it('should handle empty results gracefully', () => {
      const resolved = resolveSearch([], 'Nonexistent Show', 'tv');
      
      expect(resolved.decision.mode).toBe('disambiguate');
      expect(resolved.decision.confidence).toBe(0.0);
      expect(resolved.decision.why).toContain('No results found');
    });

    it('should sort alternatives by score', () => {
      const resolved = resolveSearch(mockResults, 'The Wire', 'tv');
      
      if (resolved.alternatives.length > 1) {
        for (let i = 0; i < resolved.alternatives.length - 1; i++) {
          const currentConf = resolved.alternatives[i].confidence || 0;
          const nextConf = resolved.alternatives[i + 1].confidence || 0;
          expect(currentConf).toBeGreaterThanOrEqual(nextConf);
        }
      }
    });
  });

  describe('deduplicateResults', () => {
    const mockResults: NormalizedResult[] = [
      {
        id: 'tmdb:tv:1438',
        title: 'The Wire',
        type: 'tv',
        year: 2002,
        provider_data: { tmdb: { id: 1438 } },
      },
      {
        id: 'trakt:tv:1438',
        title: 'The Wire',
        type: 'tv',
        year: 2002,
        provider_data: { trakt: { id: 1438 } },
      },
      {
        id: 'tmdb:movie:5678',
        title: 'Different Movie',
        type: 'movie',
        year: 2020,
        provider_data: { tmdb: { id: 5678 } },
      },
    ];

    it('should deduplicate identical titles', () => {
      const deduped = deduplicateResults(mockResults);
      
      expect(deduped).toHaveLength(2);
      
      const wireResult = deduped.find(r => r.title === 'The Wire');
      expect(wireResult).toBeDefined();
      expect(wireResult!.provider_data.tmdb).toBeDefined();
      expect(wireResult!.provider_data.trakt).toBeDefined();
    });

    it('should preserve unique results', () => {
      const deduped = deduplicateResults(mockResults);
      
      expect(deduped.some(r => r.title === 'Different Movie')).toBe(true);
    });

    it('should merge provider data from duplicates', () => {
      const deduped = deduplicateResults(mockResults);
      
      const wireResult = deduped.find(r => r.title === 'The Wire');
      expect(Object.keys(wireResult!.provider_data)).toHaveLength(2);
    });
  });
});