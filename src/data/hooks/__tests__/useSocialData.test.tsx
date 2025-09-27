import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSocialData } from '../useSocialData';

// Mock the social client
vi.mock('../../clients/socialClient', () => ({
  socialClient: {
    getLikeCount: vi.fn(() => Promise.resolve({ success: true, data: 5 })),
    hasUserLiked: vi.fn(() => Promise.resolve({ success: true, data: true }))
  }
}));

describe('useSocialData', () => {
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

  it('should fetch like count and user like status', async () => {
    const { result } = renderHook(
      () => useSocialData('point-123', 'user-456'),
      { wrapper }
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.likeCount).toBeUndefined();
    expect(result.current.hasUserLiked).toBeUndefined();
  });

  it('should return data when queries complete successfully', async () => {
    const { result } = renderHook(
      () => useSocialData('point-123', 'user-456'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.likeCount).toBe(5);
    expect(result.current.hasUserLiked).toBe(true);
  });
});