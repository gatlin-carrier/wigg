import { describe, it, expect } from 'vitest';
import { socialClient } from '../socialClient';

describe('socialClient integration tests', () => {

  it('should get like count from real API via MSW', async () => {
    try {
      const response = await socialClient.getLikeCount('point-123');

      // socialClient now returns DataLayerResponse<number>
      expect(response.success).toBe(true);
      expect(typeof response.data).toBe('number');
      expect(response.data).toBeGreaterThanOrEqual(0);
    } catch (error) {
      console.error('Test failed with error:', error);
      throw error;
    }
  });
});