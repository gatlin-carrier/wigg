import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFollowUserDataLayer } from '../useFollowUserDataLayer';
import { socialClient } from '../../../data/clients/socialClient';

// Mock the social client
vi.mock('../../../data/clients/socialClient', () => ({
  socialClient: {
    isFollowing: vi.fn(() => Promise.resolve(false)),
    followUser: vi.fn(() => Promise.resolve()),
    unfollowUser: vi.fn(() => Promise.resolve())
  }
}));

// Mock auth context
vi.mock('../../useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'test@example.com' }
  })
}));

describe('useFollowUserDataLayer', () => {
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

  it('should fetch real follow status instead of always returning false', async () => {
    // Setup: Mock socialClient to return true (user is following)
    vi.mocked(socialClient.isFollowing).mockResolvedValueOnce(true);

    const { result } = renderHook(
      () => useFollowUserDataLayer('target-user-456'),
      { wrapper }
    );

    // Initially loading should be true
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should show the real follow status from socialClient, not hardcoded false
    expect(result.current.isFollowing).toBe(true);
    expect(socialClient.isFollowing).toHaveBeenCalledWith('user-123', 'target-user-456');
  });

  it('should implement real toggle functionality using socialClient', async () => {
    // Setup: User is not following initially
    vi.mocked(socialClient.isFollowing).mockResolvedValueOnce(false);
    vi.mocked(socialClient.followUser).mockResolvedValueOnce();

    const { result } = renderHook(
      () => useFollowUserDataLayer('target-user-456'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should be able to call toggle to follow user
    await act(async () => {
      await result.current.toggle();
    });

    // Should call socialClient.followUser since user was not following
    expect(socialClient.followUser).toHaveBeenCalledWith('user-123', 'target-user-456');
  });
});