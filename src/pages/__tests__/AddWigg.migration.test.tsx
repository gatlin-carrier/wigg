import { describe, it, expect } from 'vitest';
import { useFeatureFlag } from '@/lib/featureFlags';

describe('AddWigg Migration', () => {
  it('should import feature flag successfully', () => {
    // Simple test to verify the feature flag can be imported
    const result = useFeatureFlag('test-flag');
    expect(typeof result).toBe('boolean');
  });

  it('should import useUserWiggsDataLayer for coexistence pattern', async () => {
    // This test will fail until AddWigg imports the new data layer hook
    const fs = await import('fs');
    const path = await import('path');

    const addWiggPath = path.resolve(__dirname, '../AddWigg.tsx');
    const addWiggContent = fs.readFileSync(addWiggPath, 'utf-8');

    expect(addWiggContent).toContain('useUserWiggsDataLayer');
  });

  it('should use feature flag for data layer selection in AddWigg', async () => {
    // This test will fail until AddWigg uses the feature flag to choose data layer
    const fs = await import('fs');
    const path = await import('path');

    const addWiggPath = path.resolve(__dirname, '../AddWigg.tsx');
    const addWiggContent = fs.readFileSync(addWiggPath, 'utf-8');

    expect(addWiggContent).toContain('useFeatureFlag');
    expect(addWiggContent).toContain('add-wigg-data-layer');
  });
});