import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { MediaTile } from '../MediaTile';

const classifyPeakFromSegmentsMock = vi.hoisted(() =>
  vi.fn(() => ({ label: 'Strong start', globalMaxPct: 50 })),
);

vi.mock('@/hooks/useTitleProgress', () => ({
  useTitleProgress: () => ({ data: { segments: [] } }),
}));

vi.mock('@/hooks/useLazyTitleProgress', () => ({
  useLazyTitleProgress: vi.fn(() => ({ data: { segments: [] }, elementRef: vi.fn() })),
}));

vi.mock('@/hooks/useUserWiggs', () => ({ useUserWiggs: () => ({ data: {}, addWigg: vi.fn() }) }));

vi.mock('@/data/hooks/useUserWiggsDataLayer', () => ({
  useUserWiggsDataLayer: vi.fn(() => ({ data: {}, addWigg: vi.fn() })),
}));

vi.mock('@/lib/featureFlags', () => ({
  useFeatureFlag: vi.fn(() => false),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    session: null,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    cleanupAuthState: vi.fn(),
  })),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { getSession: () => Promise.resolve({ data: { session: null } }) } } }));
vi.mock('@/lib/wigg/analysis', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/wigg/analysis')>();
  return {
    ...actual,
    classifyPeakFromSegments: classifyPeakFromSegmentsMock,
  };
});

// Helper to create test wrapper with QueryClient and Router
const createTestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

const renderTile = () => {
  render(
    <MediaTile title="Movie" imageUrl="test.jpg" year={2023} />,
    { wrapper: createTestWrapper }
  );
  return screen.getByTestId('peak-icon');
};

describe('MediaTile Peak Icon', () => {
  beforeEach(() => {
    classifyPeakFromSegmentsMock.mockReturnValue({ label: 'Strong start', globalMaxPct: 50 });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders trending-up icon for strong start', () => {
    const peakIcon = renderTile();
    expect(peakIcon).toHaveClass('lucide-trending-up');
  });

  it('renders activity icon for even pacing', () => {
    classifyPeakFromSegmentsMock.mockReturnValue({ label: 'Even pacing', globalMaxPct: 50 });
    const peakIcon = renderTile();
    expect(peakIcon).toHaveClass('lucide-activity');
  });

  it('renders minus icon for peak late pacing', () => {
    classifyPeakFromSegmentsMock.mockReturnValue({ label: 'Peak late', globalMaxPct: 80 });
    const peakIcon = renderTile();
    expect(peakIcon).toHaveClass('lucide-minus');
  });
});
