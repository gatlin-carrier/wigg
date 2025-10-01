import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from '../Dashboard';
import userEvent from '@testing-library/user-event';

class MockIntersectionObserver {
  constructor() {}
  observe() {}
  disconnect() {}
  unobserve() {}
}

beforeAll(() => {
  (global as any).IntersectionObserver = MockIntersectionObserver;
});

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

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

vi.mock('@/contexts/OnboardingContext', () => ({
  useOnboarding: () => ({ isActive: false }),
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

// Mock all the recommendation components to avoid API calls
vi.mock('@/components/tmdb/TmdbPopular', () => ({
  default: () => <div>TmdbPopular</div>,
}));

vi.mock('@/components/tmdb/TmdbPopularTv', () => ({
  default: () => <div>TmdbPopularTv</div>,
}));

vi.mock('@/components/anilist/AnilistAnime', () => ({
  default: () => <div>AnilistAnime</div>,
}));

vi.mock('@/components/anilist/AnilistManga', () => ({
  default: () => <div>AnilistManga</div>,
}));

vi.mock('@/components/anilist/AnilistWebtoons', () => ({
  default: () => <div>AnilistWebtoons</div>,
}));

vi.mock('@/components/GameRecommendations', () => ({
  GameRecommendations: () => <div>GameRecommendations</div>,
}));

vi.mock('@/components/BookRecommendations', () => ({
  BookRecommendations: () => <div>BookRecommendations</div>,
}));

vi.mock('@/components/podcast/PodcastTrending', () => ({
  default: () => <div>PodcastTrending</div>,
}));

vi.mock('./Feed', () => ({
  default: () => <div>Feed</div>,
}));

vi.mock('@/components/onboarding/OnboardingFlow', () => ({
  default: () => null,
}));

describe('Dashboard Navigation', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('should use navigate() for Live Capture button instead of window.location.href', async () => {
    // Read the Dashboard file to check if it uses window.location.href or navigate()
    const fs = await import('fs/promises');
    const path = await import('path');
    const dashboardPath = path.join(process.cwd(), 'src', 'pages', 'Dashboard.tsx');
    const dashboardContent = await fs.readFile(dashboardPath, 'utf-8');

    // Check if useNavigate is imported
    const hasNavigateImport = dashboardContent.includes("import { useNavigate }") ||
                               dashboardContent.includes("import { useNavigate,");

    // Check for window.location.href usage
    const hasWindowLocationHref = dashboardContent.includes("window.location.href = '/add-wigg/live'");

    // The test should pass when:
    // 1. useNavigate is imported
    // 2. window.location.href is NOT used (should use navigate() instead)
    expect(hasNavigateImport).toBe(true);
    expect(hasWindowLocationHref).toBe(false);
  });
});
