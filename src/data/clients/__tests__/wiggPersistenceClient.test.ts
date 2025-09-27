import { describe, it, expect, vi, beforeEach } from 'vitest';
import { wiggPersistenceClient } from '../wiggPersistenceClient';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'rating-123',
              user_id: 'user-123',
              media_id: 'media-456',
              rating: 8.5,
              notes: 'Great movie!',
              created_at: '2024-03-01T00:00:00Z'
            },
            error: null
          }))
        }))
      })),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'moment-456',
              user_id: 'user-123',
              media_id: 'media-456',
              timestamp: 120,
              content: 'Amazing scene!',
              created_at: '2024-03-01T00:00:00Z'
            },
            error: null
          }))
        }))
      }))
    }))
  }
}));

describe('wiggPersistenceClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should save a wigg rating', async () => {
    const rating = await wiggPersistenceClient.saveRating({
      user_id: 'user-123',
      media_id: 'media-456',
      rating: 8.5,
      notes: 'Great movie!'
    });

    expect(rating.id).toBe('rating-123');
    expect(rating.rating).toBe(8.5);
    expect(rating.notes).toBe('Great movie!');
  });

  it('should save a moment', async () => {
    const moment = await wiggPersistenceClient.saveMoment({
      user_id: 'user-123',
      media_id: 'media-456',
      timestamp: 120,
      content: 'Amazing scene!'
    });

    expect(moment.id).toBe('moment-456');
    expect(moment.timestamp).toBe(120);
    expect(moment.content).toBe('Amazing scene!');
  });
});