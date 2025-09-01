import { describe, it, expect } from 'vitest';
import { 
  normalizeQuery, 
  detectTokens, 
  predictMediaType, 
  generateQueryPlans,
  extractEpisodeInfo,
  extractChapterInfo
} from '../planning';
import type { SmartSearchInput } from '../types';

describe('Query Planning', () => {
  describe('normalizeQuery', () => {
    it('should normalize basic queries', () => {
      expect(normalizeQuery('The Wire')).toBe('wire');
      expect(normalizeQuery('Breaking Bad!')).toBe('breaking bad');
      expect(normalizeQuery('Game of Thrones (TV Series)')).toBe('game thrones tv series');
    });

    it('should handle special characters and multiple spaces', () => {
      expect(normalizeQuery('The Lord of the Rings: The Fellowship')).toBe('lord rings fellowship');
      expect(normalizeQuery('  Spider-Man   Into  the  Spider-Verse  ')).toBe('spider man into spider verse');
    });

    it('should remove stop words', () => {
      expect(normalizeQuery('A Song of Ice and Fire')).toBe('song ice fire');
      expect(normalizeQuery('The Chronicles of Narnia')).toBe('chronicles narnia');
    });
  });

  describe('detectTokens', () => {
    it('should detect episode tokens', () => {
      const tokens1 = detectTokens('The Wire S1E3');
      expect(tokens1.episode).toBe(true);
      
      const tokens2 = detectTokens('Breaking Bad season 2 episode 5');
      expect(tokens2.episode).toBe(true);
      
      const tokens3 = detectTokens('Game of Thrones ep 9');
      expect(tokens3.episode).toBe(true);
    });

    it('should detect book tokens', () => {
      const tokens = detectTokens('Harry Potter Chapter 12');
      expect(tokens.bookish).toBe(true);
      
      const tokens2 = detectTokens('Lord of the Rings vol. 2');
      expect(tokens2.bookish).toBe(true);
    });

    it('should detect anime/manga tokens', () => {
      const animeTokens = detectTokens('Attack on Titan anime');
      expect(animeTokens.anime).toBe(true);
      
      const mangaTokens = detectTokens('One Piece manga');
      expect(mangaTokens.manga).toBe(true);
    });

    it('should detect podcast tokens', () => {
      const tokens = detectTokens('Serial podcast episode 1');
      expect(tokens.podcast).toBe(true);
    });

    it('should detect game tokens', () => {
      const tokens = detectTokens('The Last of Us game');
      expect(tokens.games).toBe(true);
    });
  });

  describe('predictMediaType', () => {
    it('should predict TV for episode tokens', () => {
      const types = predictMediaType('The Wire S1E3');
      expect(types[0]).toBe('tv');
    });

    it('should predict books for bookish tokens', () => {
      const types = predictMediaType('Harry Potter chapter 5');
      expect(types[0]).toBe('book');
    });

    it('should predict anime for anime tokens', () => {
      const types = predictMediaType('Attack on Titan anime');
      expect(types[0]).toBe('anime');
    });

    it('should apply user preference boost', () => {
      const types = predictMediaType('Dune', { last_vertical: 'book' });
      expect(types).toContain('book');
    });

    it('should default to TV bias for ambiguous queries', () => {
      const types = predictMediaType('The Wire');
      expect(types[0]).toBe('tv');
    });
  });

  describe('generateQueryPlans', () => {
    const basicInput: SmartSearchInput = {
      user_query: 'The Wire',
      locale: 'en-US',
      market: 'US',
      cost_budget: { max_providers: 3, allow_fallbacks: true }
    };

    it('should generate TMDB plans for basic queries', () => {
      const plans = generateQueryPlans(basicInput);
      expect(plans).toHaveLength(2);
      expect(plans.some(p => p.provider === 'tmdb')).toBe(true);
    });

    it('should prioritize TV search for episode tokens', () => {
      const input = { ...basicInput, user_query: 'The Wire S1E3' };
      const plans = generateQueryPlans(input);
      
      const tvPlan = plans.find(p => p.endpoint === 'search/tv');
      expect(tvPlan).toBeDefined();
      expect(tvPlan!.weight).toBeGreaterThan(1.0);
    });

    it('should include book providers for book tokens', () => {
      const input = { ...basicInput, user_query: 'Dune chapter 5' };
      const plans = generateQueryPlans(input);
      
      expect(plans.some(p => p.provider === 'openlibrary')).toBe(true);
    });

    it('should respect cost budget', () => {
      const input = { ...basicInput, cost_budget: { max_providers: 1, allow_fallbacks: false } };
      const plans = generateQueryPlans(input);
      
      expect(plans).toHaveLength(1);
    });

    it('should handle ambiguous short queries with fallbacks', () => {
      const input = { ...basicInput, user_query: 'It' };
      const plans = generateQueryPlans(input);
      
      expect(plans.length).toBeGreaterThan(0);
      expect(plans.some(p => p.reason.includes('ambiguous') || p.reason.includes('shotgun'))).toBe(true);
    });
  });

  describe('extractEpisodeInfo', () => {
    it('should extract season and episode from S1E3 format', () => {
      const info = extractEpisodeInfo('The Wire S1E3');
      expect(info).toEqual({ season: 1, episode: 3 });
    });

    it('should extract from season X episode Y format', () => {
      const info = extractEpisodeInfo('Breaking Bad season 2 episode 5');
      expect(info).toEqual({ season: 2, episode: 5 });
    });

    it('should extract episode only from ep format', () => {
      const info = extractEpisodeInfo('Game of Thrones ep 9');
      expect(info).toEqual({ episode: 9 });
    });

    it('should return null for non-episode queries', () => {
      const info = extractEpisodeInfo('The Wire');
      expect(info).toBeNull();
    });
  });

  describe('extractChapterInfo', () => {
    it('should extract chapter numbers', () => {
      const info = extractChapterInfo('Harry Potter ch. 12');
      expect(info).toEqual({ chapter: 12 });
    });

    it('should extract volume numbers', () => {
      const info = extractChapterInfo('Lord of the Rings vol. 2');
      expect(info).toEqual({ volume: 2 });
    });

    it('should return null for non-chapter queries', () => {
      const info = extractChapterInfo('Harry Potter');
      expect(info).toBeNull();
    });
  });
});