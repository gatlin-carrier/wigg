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

    const likeCount = await socialClient.getLikeCount('point-123');

    expect(likeCount).toBe(5);
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
});