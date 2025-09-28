import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWiggLikesDataLayer } from '../useWiggLikesDataLayer';
import { socialClient } from '../../../data/clients/socialClient';

// Mock the social client
vi.mock('../../../data/clients/socialClient', () => ({
  socialClient: {
    getLikeCount: vi.fn(() => Promise.resolve({ success: true, data: 5 })),
    hasUserLiked: vi.fn(() => Promise.resolve({ success: true, data: false })),
    toggleLike: vi.fn(() => Promise.resolve({ success: true, data: undefined }))
  }
}));

// Mock auth context
vi.mock('../../useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-456', email: 'test@example.com' }
  })
}));

// Mock toast
vi.mock('../../use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('Migration: useWiggLikesDataLayer', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('should provide same interface as legacy useWiggLikes hook', async () => {
    const { result } = renderHook(
      () => useWiggLikesDataLayer('point-123'),
      { wrapper }
    );

    // Should match the legacy hook interface
    expect(result.current).toMatchObject({
      liked: expect.any(Boolean),
      count: expect.any(Number),
      loading: expect.any(Boolean),
      toggleLike: expect.any(Function),
      refreshCount: expect.any(Function)
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should have the expected initial values
    expect(result.current.liked).toBe(false);
    expect(result.current.count).toBe(5);
  });

  it('should use socialClient for data fetching and show loading state', async () => {
    const { result } = renderHook(
      () => useWiggLikesDataLayer('point-123'),
      { wrapper }
    );

    // Should start with loading state when using real queries
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should use socialClient.getLikeCount instead of hardcoded count
    expect(result.current.count).toBe(5);
    expect(result.current.liked).toBe(false);
  });

  it('should fetch user like status from socialClient', async () => {
    const { result } = renderHook(
      () => useWiggLikesDataLayer('point-123'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should use socialClient.hasUserLiked which returns false in mock
    expect(result.current.liked).toBe(false);
  });

  it('should show liked=true when user has liked the point', async () => {
    // Mock hasUserLiked to return true for this test
    vi.mocked(socialClient.hasUserLiked).mockResolvedValueOnce({ success: true, data: true });

    const { result } = renderHook(
      () => useWiggLikesDataLayer('point-123'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should show liked=true when socialClient.hasUserLiked returns true
    expect(result.current.liked).toBe(true);
  });

  it('should implement toggleLike with useMutation', async () => {
    vi.mocked(socialClient.toggleLike).mockResolvedValueOnce();

    const { result } = renderHook(
      () => useWiggLikesDataLayer('point-123'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should be able to call toggleLike
    await act(async () => {
      await result.current.toggleLike();
    });

    // Should call socialClient.toggleLike with correct parameters
    expect(socialClient.toggleLike).toHaveBeenCalledWith({
      pointId: 'point-123',
      userId: 'user-456',
      isLiked: false
    });
  });

  it('should implement refreshCount function that refetches queries', async () => {
    const { result } = renderHook(
      () => useWiggLikesDataLayer('point-123'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear previous mock calls
    vi.clearAllMocks();

    // Call refreshCount
    await act(async () => {
      await result.current.refreshCount();
    });

    // Should refetch the like count
    expect(socialClient.getLikeCount).toHaveBeenCalledWith('point-123');
  });
});