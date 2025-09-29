import { describe, it, expect } from 'vitest';

describe('WiggExperiencePlayground Migration', () => {
  it('should have completed data layer migration with feature flag', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const playgroundPath = path.resolve(__dirname, '../WiggExperiencePlayground.stories.tsx');
    const playgroundContent = fs.readFileSync(playgroundPath, 'utf-8');

    // Verify all required imports are present
    expect(playgroundContent).toContain('useUserWiggsDataLayer');
    expect(playgroundContent).toContain('useFeatureFlag');

    // Verify feature flag usage
    expect(playgroundContent).toContain('wigg-experience-playground-data-layer');

    // Verify coexistence pattern implementation
    expect(playgroundContent).toContain('useNewDataLayer');
    expect(playgroundContent).toContain('legacyWiggsData');
    expect(playgroundContent).toContain('newWiggsData');
  });
});