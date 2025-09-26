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
});