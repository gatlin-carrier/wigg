import { describe, it, expect, vi, beforeEach } from 'vitest';
import { wiggPersistenceService } from '../wiggPersistence';

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn()
  }
}));

import { supabase } from '@/integrations/supabase/client';

describe('WIGG Persistence Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should save WIGG rating successfully', async () => {
    const mockFrom = {
      insert: vi.fn().mockResolvedValue({ error: null })
    };
    (supabase.from as any).mockReturnValue(mockFrom);

    const result = await wiggPersistenceService.saveWiggRating({
      mediaId: 'media-123',
      userId: 'user-456',
      value: 2,
      position: 45,
      positionType: 'sec'
    });

    expect(result.success).toBe(true);
    expect(supabase.from).toHaveBeenCalledWith('wigg_points');
    expect(mockFrom.insert).toHaveBeenCalledWith({
      media_id: 'media-123',
      episode_id: null,
      user_id: 'user-456',
      pos_kind: 'sec',
      pos_value: 45,
      tags: ['rating_2'],
      reason_short: 'Rated better',
      spoiler: '0'
    });
  });
});