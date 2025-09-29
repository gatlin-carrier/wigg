import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { MediaTile } from '../MediaTile';

// Mock the useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock other dependencies
vi.mock('@/hooks/useTitleProgress', () => ({
  useTitleProgress: vi.fn(() => ({ data: null })),
}));

vi.mock('@/hooks/useUserWiggs', () => ({
  useUserWiggs: vi.fn(() => ({ data: null, addWigg: vi.fn() })),
}));

vi.mock('@/data/hooks/useUserWiggsDataLayer', () => ({
  useUserWiggsDataLayer: vi.fn(() => ({ data: null, addWigg: vi.fn() })),
}));

vi.mock('@/lib/featureFlags', () => ({
  useFeatureFlag: vi.fn(() => false),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

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

describe('MediaTile Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect unauthenticated users to auth page when clicking add button', async () => {
    // Mock unauthenticated state
    const { useAuth } = await import('@/hooks/useAuth');
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      cleanupAuthState: vi.fn(),
    });

    render(
      <MediaTile
        title="Test Movie"
        imageUrl="https://example.com/poster.jpg"
        year={2023}
        mediaData={{
          source: 'tmdb-movie',
          id: '123',
          title: 'Test Movie',
          type: 'movie',
          posterUrl: 'https://example.com/poster.jpg',
          year: 2023,
        }}
      />,
      { wrapper: createTestWrapper }
    );

    // Find and click the add button
    const addButton = screen.getByLabelText('Add WIGG point');
    fireEvent.click(addButton);

    // Should navigate to auth page with context
    expect(mockNavigate).toHaveBeenCalledWith('/auth', {
      state: expect.objectContaining({
        returnTo: expect.any(String),
        message: expect.stringContaining('Sign in'),
      }),
    });
  });

  it('should allow authenticated users to proceed with add wigg flow', async () => {
    // Mock authenticated state
    const { useAuth } = await import('@/hooks/useAuth');
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user123', email: 'test@example.com' } as any,
      session: { user: { id: 'user123' } } as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      cleanupAuthState: vi.fn(),
    });

    render(
      <MediaTile
        title="Test Movie"
        imageUrl="https://example.com/poster.jpg"
        year={2023}
        quickWiggEnabled={false} // Disable quick wigg to test legacy flow
        mediaData={{
          source: 'tmdb-movie',
          id: '123',
          title: 'Test Movie',
          type: 'movie',
          posterUrl: 'https://example.com/poster.jpg',
          year: 2023,
        }}
      />,
      { wrapper: createTestWrapper }
    );

    // Find and click the add button
    const addButton = screen.getByLabelText('Add WIGG point');
    fireEvent.click(addButton);

    // Should navigate to add-wigg page (not auth page)
    expect(mockNavigate).toHaveBeenCalledWith('/add-wigg', {
      state: { media: expect.any(Object) },
    });
  });

  it('should prevent form submission when add button is clicked', async () => {
    // Mock authenticated state
    const { useAuth } = await import('@/hooks/useAuth');
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user123', email: 'test@example.com' } as any,
      session: { user: { id: 'user123' } } as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      cleanupAuthState: vi.fn(),
    });

    // Create a form with submit handler to test prevention
    const mockFormSubmit = vi.fn();

    render(
      <form onSubmit={mockFormSubmit}>
        <MediaTile
          title="Test Movie"
          imageUrl="https://example.com/poster.jpg"
          year={2023}
          quickWiggEnabled={true} // Enable quick wigg modal
          mediaData={{
            source: 'tmdb-movie',
            id: '123',
            title: 'Test Movie',
            type: 'movie',
            posterUrl: 'https://example.com/poster.jpg',
            year: 2023,
          }}
        />
      </form>,
      { wrapper: createTestWrapper }
    );

    // Find and click the add button
    const addButton = screen.getByLabelText('Add WIGG point');
    fireEvent.click(addButton);

    // Form should NOT be submitted because button has type="button"
    expect(mockFormSubmit).not.toHaveBeenCalled();

    // Should not navigate to add-wigg page (quick modal should handle it)
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});