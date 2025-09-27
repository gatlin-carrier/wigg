import { describe, it, expect, vi, beforeEach } from 'vitest';
import { socialClient } from '../socialClient';

// Mock Supabase client to return errors
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn()
  }
}));

import { supabase } from '@/integrations/supabase/client';

describe('Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return standardized error response when Supabase operation fails', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116', message: 'Function not found', details: 'rpc call failed' }
    });

    const result = await socialClient.getLikeCount('point-123');

    expect(result).toEqual({
      success: false,
      error: {
        code: 'PGRST116',
        message: 'Function not found',
        details: 'rpc call failed'
      }
    });
  });

  it('should return standardized success response when operation succeeds', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: 42,
      error: null
    });

    const result = await socialClient.getLikeCount('point-456');

    expect(result).toEqual({
      success: true,
      data: 42
    });
  });
});