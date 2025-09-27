import { describe, it, expect, vi, beforeEach } from 'vitest';
import { socialClient } from '../socialClient';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: [
              {
                id: 'comment-1',
                user_id: 'user-123',
                point_id: 'point-456',
                content: 'Great point!',
                created_at: '2024-03-01T00:00:00Z',
                profiles: { username: 'testuser' }
              }
            ],
            error: null
          }))
        }))
      })),
      insert: vi.fn(() => ({
        error: null
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            error: null
          }))
        }))
      }))
    }))
  }
}));

import { supabase } from '@/integrations/supabase/client';

describe('socialClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get like count for a wigg point', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: 5,
      error: null
    });

    const result = await socialClient.getLikeCount('point-123');

    expect(result).toEqual({
      success: true,
      data: 5
    });
    expect(supabase.rpc).toHaveBeenCalledWith('get_wigg_point_like_count', { point_id: 'point-123' });
  });

  it('should check if user has liked a wigg point', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: true,
      error: null
    });

    const hasLiked = await socialClient.hasUserLiked('point-123', 'user-456');

    expect(hasLiked).toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith('user_liked_wigg_point', { point_id: 'point-123', user_id: 'user-456' });
  });

  it('should toggle like on a wigg point', async () => {
    const mockInsert = vi.fn().mockReturnValue({ error: null });
    vi.mocked(supabase.from).mockReturnValueOnce({
      insert: mockInsert
    } as any);

    await socialClient.toggleLike({ pointId: 'point-123', userId: 'user-456', isLiked: false });

    expect(supabase.from).toHaveBeenCalledWith('wigg_point_likes');
    expect(mockInsert).toHaveBeenCalledWith({
      point_id: 'point-123',
      user_id: 'user-456'
    });
  });

  it('should get comments for a wigg point', async () => {
    const comments = await socialClient.getComments('point-123');

    expect(comments).toHaveLength(1);
    expect(comments[0]).toEqual({
      id: 'comment-1',
      userId: 'user-123',
      username: 'testuser',
      content: 'Great point!',
      createdAt: '2024-03-01T00:00:00Z'
    });
  });

  it('should check if user is following another user', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { follower_id: 'user-123', following_id: 'user-456' },
              error: null
            }))
          }))
        }))
      }))
    } as any);

    const isFollowing = await socialClient.isFollowing('user-123', 'user-456');

    expect(isFollowing).toBe(true);
  });

  it('should follow a user', async () => {
    const mockInsert = vi.fn().mockReturnValue({ error: null });
    vi.mocked(supabase.from).mockReturnValueOnce({
      insert: mockInsert
    } as any);

    await socialClient.followUser('user-123', 'user-456');

    expect(supabase.from).toHaveBeenCalledWith('user_follows');
    expect(mockInsert).toHaveBeenCalledWith({
      follower_id: 'user-123',
      following_id: 'user-456'
    });
  });

  it('should unfollow a user', async () => {
    const mockDelete = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null }))
      }))
    }));
    vi.mocked(supabase.from).mockReturnValueOnce({
      delete: mockDelete
    } as any);

    await socialClient.unfollowUser('user-123', 'user-456');

    expect(supabase.from).toHaveBeenCalledWith('user_follows');
    expect(mockDelete).toHaveBeenCalled();
  });

  it('should add comment to a wigg point', async () => {
    const mockInsert = vi.fn().mockReturnValue({ error: null });
    vi.mocked(supabase.from).mockReturnValueOnce({
      insert: mockInsert
    } as any);

    const result = await socialClient.addComment({
      pointId: 'point-123',
      userId: 'user-456',
      content: 'Great point!'
    });

    expect(result).toEqual({
      success: true,
      data: null
    });
    expect(supabase.from).toHaveBeenCalledWith('wigg_point_comments');
    expect(mockInsert).toHaveBeenCalledWith({
      point_id: 'point-123',
      user_id: 'user-456',
      content: 'Great point!'
    });
  });

  it('should delete comment from a wigg point', async () => {
    const mockDelete = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null }))
      }))
    }));
    vi.mocked(supabase.from).mockReturnValueOnce({
      delete: mockDelete
    } as any);

    const result = await socialClient.deleteComment({
      commentId: 'comment-123',
      userId: 'user-456'
    });

    expect(result).toEqual({
      success: true,
      data: null
    });
    expect(supabase.from).toHaveBeenCalledWith('wigg_point_comments');
    expect(mockDelete).toHaveBeenCalled();
  });
});