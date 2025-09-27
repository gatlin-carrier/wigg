import { describe, it, expect, vi, beforeEach } from 'vitest';
import { wiggPointsClient } from '../wiggPointsClient';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'test-id-1',
            media_id: 'media-123',
            user_id: 'user-456',
            pos_value: 30,
            pos_kind: 'percent',
            reason_short: 'Test reason',
            spoiler_level: 1,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ],
        error: null
      })
    }))
  }
}));

describe('wiggPointsClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch user wigg points for a media', async () => {
    const result = await wiggPointsClient.getUserWiggPoints('user-456', 'media-123');

    expect(result).toEqual([
      {
        id: 'test-id-1',
        media_id: 'media-123',
        user_id: 'user-456',
        pos_value: 30,
        pos_kind: 'percent',
        reason_short: 'Test reason',
        spoiler_level: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ]);
  });

  it('should call Supabase with correct parameters', async () => {
    await wiggPointsClient.getUserWiggPoints('user-456', 'media-123');

    // Should have called the mocked Supabase methods with correct parameters
    expect(supabase.from).toHaveBeenCalledWith('wigg_points');
  });

  it('should use actual Supabase query result', async () => {
    // Update the mock to return different data
    const mockFrom = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'different-id',
            media_id: 'different-media',
            user_id: 'different-user',
            pos_value: 50,
            pos_kind: 'percent',
            reason_short: 'Different reason',
            spoiler_level: 2,
            created_at: '2024-02-01T00:00:00Z',
            updated_at: '2024-02-01T00:00:00Z'
          }
        ],
        error: null
      })
    }));

    // @ts-ignore - overriding the mock for this test
    supabase.from = mockFrom;

    const result = await wiggPointsClient.getUserWiggPoints('user-456', 'media-123');

    // Should return the data from the actual Supabase query, not hardcoded data
    expect(result).toEqual([
      {
        id: 'different-id',
        media_id: 'different-media',
        user_id: 'different-user',
        pos_value: 50,
        pos_kind: 'percent',
        reason_short: 'Different reason',
        spoiler_level: 2,
        created_at: '2024-02-01T00:00:00Z',
        updated_at: '2024-02-01T00:00:00Z'
      }
    ]);
  });
});