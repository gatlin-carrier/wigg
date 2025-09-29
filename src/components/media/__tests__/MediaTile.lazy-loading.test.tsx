import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MediaTile from '../MediaTile';

// Mock the hooks
vi.mock('@/hooks/useLazyTitleProgress', () => ({
  useLazyTitleProgress: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
    elementRef: { current: null },
    isVisible: false
  }))
}));

vi.mock('@/hooks/useTitleProgress', () => ({
  useTitleProgress: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null
  }))
}));

vi.mock('@/hooks/useUserWiggs', () => ({
  useUserWiggs: vi.fn(() => ({
    data: { t2gEstimatePct: 30 },
    addWigg: vi.fn()
  }))
}));

vi.mock('@/data/hooks/useUserWiggsDataLayer', () => ({
  useUserWiggsDataLayer: vi.fn(() => ({
    data: { t2gEstimatePct: 30 },
    addWigg: vi.fn()
  }))
}));

vi.mock('@/lib/featureFlags', () => ({
  useFeatureFlag: vi.fn((flag) => {
    if (flag === 'title-progress-lazy-loading') return true;
    return false;
  })
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ user: null }))
}));

describe('MediaTile lazy loading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use lazy title progress when feature flag is enabled', async () => {
    const { useLazyTitleProgress } = await import('@/hooks/useLazyTitleProgress');

    render(
      <MemoryRouter>
        <MediaTile title="Test Movie" />
      </MemoryRouter>
    );

    expect(useLazyTitleProgress).toHaveBeenCalledWith('Test Movie');
  });
});