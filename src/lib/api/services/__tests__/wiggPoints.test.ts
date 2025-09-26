import { describe, it, expect, vi, beforeEach } from 'vitest';
import { wiggPointService } from '../wiggPoints';

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn()
  }
}));

import { supabase } from '@/integrations/supabase/client';

describe('WIGG Point Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create WIGG point successfully', async () => {
    const mockMediaId = 'media-123';

    // Mock media creation first
    (supabase.rpc as any)
      .mockResolvedValueOnce({ data: mockMediaId, error: null }) // upsert_media
      .mockResolvedValueOnce({ data: null, error: null }); // add_wigg

    const result = await wiggPointService.createWiggPoint({
      mediaTitle: 'Test Game',
      mediaType: 'game',
      posKind: 'min',
      posValue: 30,
      spoilerLevel: 1,
      reasonShort: 'Gets exciting here',
      tags: ['action', 'combat'],
      userId: 'user-456'
    });

    expect(result.success).toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith('upsert_media', {
      p_title: 'Test Game',
      p_type: 'game',
      p_year: null
    });
    expect(supabase.rpc).toHaveBeenCalledWith('add_wigg', {
      p_media_id: mockMediaId,
      p_episode_id: null,
      p_user_id: 'user-456',
      p_pos_kind: 'min',
      p_pos_value: 30,
      p_tags: ['action', 'combat'],
      p_reason_short: 'Gets exciting here',
      p_spoiler: 1
    });
  });

  it('should handle errors in media creation with standardized error response', async () => {
    const errorMessage = 'Media creation failed';
    (supabase.rpc as any).mockResolvedValueOnce({ data: null, error: { message: errorMessage } });

    const result = await wiggPointService.createWiggPoint({
      mediaTitle: 'Test Game',
      mediaType: 'game',
      posKind: 'min',
      posValue: 30,
      spoilerLevel: 1,
      reasonShort: 'Gets exciting here',
      tags: ['action', 'combat'],
      userId: 'user-456'
    });

    expect(result.success).toBe(false);
    expect(result.error.message).toBe(errorMessage);
    expect(result.data).toBe(null);
  });
});