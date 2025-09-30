import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

describe('MediaTile Authentication', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
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
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
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
          />
        </MemoryRouter>
      </QueryClientProvider>
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
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
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
          />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Find and click the add button
    const addButton = screen.getByLabelText('Add WIGG point');
    fireEvent.click(addButton);

    // Should navigate to add-wigg page (not auth page)
    expect(mockNavigate).toHaveBeenCalledWith('/add-wigg', {
      state: { media: expect.any(Object) },
    });
  });

  it('should open quick wigg modal without submitting surrounding forms', async () => {
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

    const handleSubmit = vi.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmit();
            }}
          >
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
            />
          </form>
        </MemoryRouter>
      </QueryClientProvider>
    );

    const addButton = screen.getByLabelText('Add WIGG point');
    fireEvent.click(addButton);

    await screen.findByText('Quick Wigg — Test Movie');
    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
