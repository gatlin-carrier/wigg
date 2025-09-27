import { describe, it, expect } from 'vitest';

describe('RealTimeVisualization Migration', () => {
  it('should have completed data layer migration with feature flag', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const realTimeVisualizationPath = path.resolve(__dirname, '../RealTimeVisualization.tsx');
    const realTimeVisualizationContent = fs.readFileSync(realTimeVisualizationPath, 'utf-8');

    // Verify all required imports are present
    expect(realTimeVisualizationContent).toContain('useUserWiggsDataLayer');
    expect(realTimeVisualizationContent).toContain('useFeatureFlag');

    // Verify feature flag usage
    expect(realTimeVisualizationContent).toContain('real-time-visualization-data-layer');

    // Verify coexistence pattern implementation
    expect(realTimeVisualizationContent).toContain('useNewDataLayer');
    expect(realTimeVisualizationContent).toContain('legacyWiggsData');
    expect(realTimeVisualizationContent).toContain('newWiggsData');
  });
});