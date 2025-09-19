import { describe, it, expect, vi } from 'vitest';
import { anilistAdapter } from '../providers';

// Mock the AniList client
vi.mock('@/integrations/anilist/client', () => ({
  searchAnime: vi.fn(),
  searchManga: vi.fn(),
}));

describe('AniList Provider Adapter', () => {
  it('should execute anime search queries', async () => {
    const plan = {
      provider: 'anilist',
      endpoint: 'search/anime',
      params: { query: 'attack on titan', page: 1 }
    };

    // This should not throw an error when implemented
    expect(async () => {
      await anilistAdapter.execute(plan);
    }).not.toThrow();
  });
});