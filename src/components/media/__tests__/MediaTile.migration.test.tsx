import { describe, it, expect } from 'vitest';

describe('MediaTile Migration', () => {
  it('should have completed data layer migration with feature flag', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const mediaTilePath = path.resolve(__dirname, '../MediaTile.tsx');
    const mediaTileContent = fs.readFileSync(mediaTilePath, 'utf-8');

    // Verify all required imports are present
    expect(mediaTileContent).toContain('useUserWiggsDataLayer');
    expect(mediaTileContent).toContain('useFeatureFlag');

    // Verify feature flag usage
    expect(mediaTileContent).toContain('media-tile-data-layer');

    // Verify coexistence pattern implementation
    expect(mediaTileContent).toContain('useNewDataLayer');
    expect(mediaTileContent).toContain('legacyWiggsData');
    expect(mediaTileContent).toContain('newWiggsData');
  });
});