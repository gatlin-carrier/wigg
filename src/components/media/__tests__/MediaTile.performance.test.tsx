import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import MediaTile from '../MediaTile';

// Mock matchMedia for useIsMobile hook
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock the hooks that MediaTile uses
vi.mock('@/hooks/useTitleProgress', () => ({
  useTitleProgress: () => ({ data: null }),
}));

vi.mock('@/hooks/useLazyTitleProgress', () => ({
  useLazyTitleProgress: vi.fn(() => ({ data: null, elementRef: vi.fn() })),
}));

vi.mock('@/hooks/useUserWiggs', () => ({
  useUserWiggs: () => ({ data: null, addWigg: vi.fn() }),
}));

vi.mock('@/data/hooks/useUserWiggsDataLayer', () => ({
  useUserWiggsDataLayer: vi.fn(() => ({ data: null, addWigg: vi.fn() })),
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

describe('MediaTile Performance', () => {
  it('should memoize when props remain unchanged', () => {
    let renderCount = 0;

    // Track render calls to PacingBarcode component
    const OriginalPacingBarcode = vi.fn(() => {
      renderCount++;
      return <div data-testid="pacing-barcode">Mocked PacingBarcode</div>;
    });

    vi.doMock('@/components/wigg/PacingBarcode', () => ({
      PacingBarcode: OriginalPacingBarcode,
    }));

    const props = {
      title: 'Test Movie',
      imageUrl: 'https://example.com/image.jpg',
      year: 2023,
      ratingLabel: '8.5/10',
    };

    const { rerender } = render(
      <MediaTile {...props} />,
      { wrapper: createTestWrapper }
    );

    const initialRenderCount = renderCount;

    // Re-render with identical props - should not re-render child components
    rerender(
      <MediaTile {...props} />
    );

    // Without proper memoization, PacingBarcode will re-render unnecessarily
    expect(renderCount).toBe(initialRenderCount);
  });
});