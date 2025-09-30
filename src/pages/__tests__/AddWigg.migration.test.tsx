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

  it('should define handleMediaSelect before useEffect that depends on it (prevents ReferenceError)', async () => {
    // Regression test for P0 issue: handleMediaSelect must be defined before any useEffect that references it
    const fs = await import('fs');
    const path = await import('path');

    const addWiggPath = path.resolve(__dirname, '../AddWigg.tsx');
    const addWiggContent = fs.readFileSync(addWiggPath, 'utf-8');

    // Find the position of handleMediaSelect definition
    const handleMediaSelectMatch = addWiggContent.match(/const handleMediaSelect = React\.useCallback/);
    expect(handleMediaSelectMatch, 'handleMediaSelect should be defined with React.useCallback').toBeTruthy();

    const handleMediaSelectPos = handleMediaSelectMatch!.index!;

    // Find the position of useEffect that uses handleMediaSelect
    const useEffectPattern = /useEffect\(\(\) => \{[^}]*handleMediaSelect\(passedMedia\)/;
    const useEffectMatch = addWiggContent.match(useEffectPattern);
    expect(useEffectMatch, 'useEffect that calls handleMediaSelect should exist').toBeTruthy();

    const useEffectPos = useEffectMatch!.index!;

    // handleMediaSelect must be defined BEFORE the useEffect that uses it
    expect(handleMediaSelectPos).toBeLessThan(useEffectPos);
  });
});