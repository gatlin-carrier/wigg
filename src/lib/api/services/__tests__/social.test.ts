import { describe, it, expect, vi, beforeEach } from 'vitest';
import { socialService } from '../social';

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn()
  }
}));

import { supabase } from '@/integrations/supabase/client';

describe('Social Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get follower counts successfully', async () => {
    const mockFollowerData = 150;
    const mockFollowingData = 75;

    (supabase.rpc as any)
      .mockResolvedValueOnce({ data: mockFollowerData, error: null })
      .mockResolvedValueOnce({ data: mockFollowingData, error: null });

    const result = await socialService.getFollowerCounts('user-123');

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      followers: mockFollowerData,
      following: mockFollowingData
    });
    expect(supabase.rpc).toHaveBeenCalledWith('get_follower_count', { user_id: 'user-123' });
    expect(supabase.rpc).toHaveBeenCalledWith('get_following_count', { user_id: 'user-123' });
  });

  it('should toggle like on WIGG point', async () => {
    const mockFrom = {
      insert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis()
    };
    (supabase.from as any).mockReturnValue(mockFrom);
    mockFrom.eq.mockResolvedValue({ error: null });

    const result = await socialService.toggleLike({
      pointId: 'point-456',
      userId: 'user-123',
      isLiked: false
    });

    expect(result.success).toBe(true);
    expect(supabase.from).toHaveBeenCalledWith('wigg_point_likes');
    expect(mockFrom.insert).toHaveBeenCalledWith({
      point_id: 'point-456',
      user_id: 'user-123'
    });
  });

  it('should remove like when toggling off', async () => {
    const mockDeleteChain = {
      eq: vi.fn().mockReturnThis()
    };
    // Set up the final resolution after both eq() calls
    mockDeleteChain.eq
      .mockReturnValueOnce(mockDeleteChain) // First .eq() returns the chain
      .mockResolvedValueOnce({ error: null }); // Second .eq() resolves

    const mockFrom = {
      insert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockReturnValue(mockDeleteChain),
      eq: vi.fn().mockReturnThis()
    };
    (supabase.from as any).mockReturnValue(mockFrom);

    const result = await socialService.toggleLike({
      pointId: 'point-456',
      userId: 'user-123',
      isLiked: true
    });

    expect(result.success).toBe(true);
    expect(supabase.from).toHaveBeenCalledWith('wigg_point_likes');
    expect(mockFrom.delete).toHaveBeenCalled();
    expect(mockDeleteChain.eq).toHaveBeenCalledWith('point_id', 'point-456');
    expect(mockDeleteChain.eq).toHaveBeenCalledWith('user_id', 'user-123');
  });

  it('should get like count for WIGG point', async () => {
    const mockLikeCount = 42;
    (supabase.rpc as any).mockResolvedValue({ data: mockLikeCount, error: null });

    const result = await socialService.getLikeCount('point-789');

    expect(result.success).toBe(true);
    expect(result.data).toBe(mockLikeCount);
    expect(supabase.rpc).toHaveBeenCalledWith('get_wigg_point_like_count', { point_id: 'point-789' });
  });

  it('should check if user has liked WIGG point', async () => {
    const mockHasLiked = true;
    (supabase.rpc as any).mockResolvedValue({ data: mockHasLiked, error: null });

    const result = await socialService.hasUserLiked('point-456', 'user-123');

    expect(result.success).toBe(true);
    expect(result.data).toBe(mockHasLiked);
    expect(supabase.rpc).toHaveBeenCalledWith('user_liked_wigg_point', { point_id: 'point-456', user_id: 'user-123' });
  });

  it('should handle errors in getFollowerCounts with standardized error response', async () => {
    const errorMessage = 'Database connection failed';
    (supabase.rpc as any).mockResolvedValueOnce({ data: null, error: { message: errorMessage } });

    const result = await socialService.getFollowerCounts('user-123');

    expect(result.success).toBe(false);
    expect(result.error.message).toBe(errorMessage);
    expect(result.data).toBe(null);
  });

  it('should return error response instead of throwing for getLikeCount', async () => {
    const errorMessage = 'RPC call failed';
    (supabase.rpc as any).mockResolvedValue({ data: null, error: { message: errorMessage } });

    const result = await socialService.getLikeCount('point-123');

    expect(result.success).toBe(false);
    expect(result.error.message).toBe(errorMessage);
    expect(result.data).toBe(null);
  });

  it('should return error response instead of throwing for hasUserLiked', async () => {
    const errorMessage = 'User permission denied';
    (supabase.rpc as any).mockResolvedValue({ data: null, error: { message: errorMessage } });

    const result = await socialService.hasUserLiked('point-123', 'user-456');

    expect(result.success).toBe(false);
    expect(result.error.message).toBe(errorMessage);
    expect(result.data).toBe(null);
  });
});