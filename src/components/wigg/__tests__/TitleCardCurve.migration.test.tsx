import { describe, it, expect } from 'vitest';

describe('TitleCardCurve Migration', () => {
  it('should have completed data layer migration with feature flag', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const titleCardCurvePath = path.resolve(__dirname, '../TitleCardCurve.tsx');
    const titleCardCurveContent = fs.readFileSync(titleCardCurvePath, 'utf-8');

    // Verify all required imports are present
    expect(titleCardCurveContent).toContain('useUserWiggsDataLayer');
    expect(titleCardCurveContent).toContain('useFeatureFlag');

    // Verify feature flag usage
    expect(titleCardCurveContent).toContain('title-card-curve-data-layer');

    // Verify coexistence pattern implementation
    expect(titleCardCurveContent).toContain('useNewDataLayer');
    expect(titleCardCurveContent).toContain('legacyWiggsData');
    expect(titleCardCurveContent).toContain('newWiggsData');
  });
});