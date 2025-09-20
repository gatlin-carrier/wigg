import { describe, it, expect } from 'vitest';
import { anilistAdapter } from '../providers';

describe('AniList Provider Adapter', () => {
  it('throws for unsupported anime search endpoint until implemented', async () => {
    await expect(
      anilistAdapter.execute({ provider: 'anilist', endpoint: 'search/anime', params: { query: 'attack on titan', page: 1 } })
    ).rejects.toThrow('Unsupported AniList endpoint');
  });
});
