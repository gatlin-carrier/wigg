import { describe, it, expect } from 'vitest';

describe('useAnalyticsWorker minimal test', () => {
  it('should have a hook that can be imported', async () => {
    // Verifies that the useAnalyticsWorker hook can be imported and is properly defined
    const { useAnalyticsWorker } = await import('../useAnalyticsWorker');
    expect(useAnalyticsWorker).toBeDefined();
  });
});