import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mediaService } from '../media';

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn()
  }
}));

import { supabase } from '@/integrations/supabase/client';

describe('Media Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create media entry successfully', async () => {
    const mockMediaId = 'media-123';
    (supabase.rpc as any).mockResolvedValue({
      data: mockMediaId,
      error: null
    });

    const result = await mediaService.createMedia({
      title: 'Test Movie',
      type: 'movie',
      year: 2023
    });

    expect(result.success).toBe(true);
    expect(result.data).toBe(mockMediaId);
    expect(supabase.rpc).toHaveBeenCalledWith('upsert_media', {
      p_title: 'Test Movie',
      p_type: 'movie',
      p_year: 2023
    });
  });
});