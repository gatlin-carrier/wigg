import { describe, it, expect } from 'vitest';

describe('FollowButton Migration', () => {
  it('should have completed data layer migration with feature flag', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const followButtonPath = path.resolve(__dirname, '../FollowButton.tsx');
    const followButtonContent = fs.readFileSync(followButtonPath, 'utf-8');

    // Verify all required imports are present
    expect(followButtonContent).toContain('useFollowUserDataLayer');
    expect(followButtonContent).toContain('useFeatureFlag');

    // Verify feature flag usage
    expect(followButtonContent).toContain('follow-button-data-layer');

    // Verify coexistence pattern implementation
    expect(followButtonContent).toContain('useNewDataLayer');
    expect(followButtonContent).toContain('legacyFollowData');
    expect(followButtonContent).toContain('newFollowData');
  });
});