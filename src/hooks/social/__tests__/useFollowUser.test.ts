import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useFollowUser } from '../useFollowUser';
import { socialService } from '@/lib/api/services/social';

// Mock dependencies
vi.mock('@/lib/api/services/social');
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: { username: 'testuser' }
    }
  })
}));
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() })
}));
vi.mock('@/services/notificationTriggers', () => ({
  notifyUserFollowed: vi.fn().mockResolvedValue(undefined)
}));

const mockSocialService = socialService as any;

describe('useFollowUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use social service instead of direct Supabase calls', async () => {
    mockSocialService.checkFollowing = vi.fn().mockResolvedValue({
      success: true,
      data: false
    });

    mockSocialService.followUser = vi.fn().mockResolvedValue({
      success: true,
      data: null
    });

    const { result } = renderHook(() => useFollowUser('user-456'));

    // Wait for the hook to check following status
    await waitFor(() => {
      expect(mockSocialService.checkFollowing).toHaveBeenCalledWith({
        followerId: 'user-123',
        targetUserId: 'user-456'
      });
    });

    expect(result.current.isFollowing).toBe(false);

    // Test follow functionality
    await act(async () => {
      await result.current.follow();
    });

    expect(mockSocialService.followUser).toHaveBeenCalledWith({
      followerId: 'user-123',
      targetUserId: 'user-456'
    });
  });
});