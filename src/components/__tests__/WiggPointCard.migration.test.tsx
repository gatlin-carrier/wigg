import { describe, it, expect } from 'vitest';

describe('WiggPointCard Migration', () => {
  it('should have completed data layer migration with feature flag', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const wiggPointCardPath = path.resolve(__dirname, '../WiggPointCard.tsx');
    const wiggPointCardContent = fs.readFileSync(wiggPointCardPath, 'utf-8');

    // Verify all required imports are present
    expect(wiggPointCardContent).toContain('useWiggLikesDataLayer');
    expect(wiggPointCardContent).toContain('useFeatureFlag');

    // Verify feature flag usage
    expect(wiggPointCardContent).toContain('wigg-point-card-data-layer');

    // Verify coexistence pattern implementation
    expect(wiggPointCardContent).toContain('useNewDataLayer');
    expect(wiggPointCardContent).toContain('legacyLikesData');
    expect(wiggPointCardContent).toContain('newLikesData');
  });
});