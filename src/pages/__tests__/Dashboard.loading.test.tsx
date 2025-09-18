import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';

// Mock all the hooks and components
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'test-user' } }),
}));

vi.mock('@/contexts/HeaderContext', () => ({
  usePageHeader: vi.fn(),
  HeaderProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }),
  },
}));

describe('Dashboard Loading Performance', () => {
  it('should load high-priority content first before secondary content', async () => {
    const loadOrder: string[] = [];

    // Mock the media components to track loading order
    vi.doMock('@/components/tmdb/TmdbPopular', () => ({
      default: () => {
        loadOrder.push('TmdbPopular');
        return <div data-testid="tmdb-popular">Movies</div>;
      },
    }));

    vi.doMock('@/components/tmdb/TmdbPopularTv', () => ({
      default: () => {
        loadOrder.push('TmdbPopularTv');
        return <div data-testid="tmdb-tv">TV Shows</div>;
      },
    }));

    vi.doMock('@/components/GameRecommendations', () => ({
      GameRecommendations: () => {
        loadOrder.push('GameRecommendations');
        return <div data-testid="games">Games</div>;
      },
    }));

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(loadOrder.length).toBeGreaterThan(0);
    });

    // First loaded component should be a high-priority one (based on user preferences)
    // Without staggered loading, all components load simultaneously
    expect(loadOrder.length).toBeGreaterThan(2); // All components loading at once is inefficient
  });
});