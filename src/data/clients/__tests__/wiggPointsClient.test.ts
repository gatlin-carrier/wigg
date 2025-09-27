import { describe, it, expect, vi, beforeEach } from 'vitest';
import { wiggPointsClient } from '../wiggPointsClient';

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
});