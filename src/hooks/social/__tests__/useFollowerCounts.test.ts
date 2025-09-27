import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFollowerCounts } from '../useFollowerCounts';
import { socialService } from '@/lib/api/services/social';

// Mock dependencies
vi.mock('@/lib/api/services/social');

const mockSocialService = socialService as any;

describe('useFollowerCounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use social service instead of direct Supabase calls', async () => {
    const mockCounts = {
      followers: 150,
      following: 75
    };

    mockSocialService.getFollowerCounts = vi.fn().mockResolvedValue({
      success: true,
      data: mockCounts
    });

    const { result } = renderHook(() => useFollowerCounts('user-123'));

    // Wait for the hook to call the service
    await waitFor(() => {
      expect(mockSocialService.getFollowerCounts).toHaveBeenCalledWith('user-123');
    });

    expect(mockSocialService.getFollowerCounts).toHaveBeenCalledWith('user-123');
    expect(result.current.followers).toBe(150);
    expect(result.current.following).toBe(75);
  });
});