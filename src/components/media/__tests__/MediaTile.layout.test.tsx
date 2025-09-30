import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { MediaTile } from '../MediaTile';

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

describe('MediaTile Layout Stability', () => {
  it('should have explicit dimensions on images to prevent layout shifts', () => {
    const { container } = render(
      <MediaTile
        title="Test Movie"
        imageUrl="https://example.com/poster.jpg"
        year={2023}
        ratingLabel="8.5/10"
      />,
      { wrapper: createTestWrapper }
    );

    const image = container.querySelector('img');
    expect(image).toBeTruthy();

    // Images should have explicit width and height attributes to prevent CLS
    expect(image?.getAttribute('width')).toBeTruthy();
    expect(image?.getAttribute('height')).toBeTruthy();

    // Should maintain aspect ratio
    const width = parseInt(image?.getAttribute('width') || '0');
    const height = parseInt(image?.getAttribute('height') || '0');
    const aspectRatio = width / height;
    expect(aspectRatio).toBeCloseTo(2/3, 1); // 2:3 aspect ratio for posters
  });
});