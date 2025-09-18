import { describe, it, expect } from 'vitest';

describe('useAnalyticsWorker minimal test', () => {
  it('should have a hook that can be imported', async () => {
    // This test will fail because the file doesn't exist
    const { useAnalyticsWorker } = await import('../useAnalyticsWorker');
    expect(useAnalyticsWorker).toBeDefined();
  });
});