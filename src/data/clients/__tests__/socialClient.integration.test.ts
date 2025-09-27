import { describe, it, expect } from 'vitest';
import { socialClient } from '../socialClient';

describe('socialClient integration tests', () => {

  it('should get like count from real API via MSW', async () => {
    try {
      const likeCount = await socialClient.getLikeCount('point-123');

      expect(typeof likeCount).toBe('number');
      expect(likeCount).toBeGreaterThanOrEqual(0);
    } catch (error) {
      console.error('Test failed with error:', error);
      throw error;
    }
  });
});