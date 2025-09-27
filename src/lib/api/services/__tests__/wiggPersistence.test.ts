import { describe, it, expect, vi, beforeEach } from 'vitest';
import { wiggPersistenceService } from '../wiggPersistence';

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn()
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

  it('should save moment successfully', async () => {
    const mockFrom = {
      insert: vi.fn().mockResolvedValue({ error: null })
    };
    (supabase.from as any).mockReturnValue(mockFrom);

    const result = await wiggPersistenceService.saveMoment({
      mediaId: 'media-123',
      episodeId: 'episode-456',
      userId: 'user-789',
      anchorType: 'timestamp',
      anchorValue: 125,
      whyTags: ['funny', 'character-development'],
      notes: 'Great character moment',
      spoilerLevel: 'light'
    });

    expect(result.success).toBe(true);
    expect(supabase.from).toHaveBeenCalledWith('wigg_points');
    expect(mockFrom.insert).toHaveBeenCalledWith({
      media_id: 'media-123',
      episode_id: 'episode-456',
      user_id: 'user-789',
      pos_kind: 'sec',
      pos_value: 125,
      tags: ['funny', 'character-development'],
      reason_short: 'Great character moment',
      spoiler: '1'
    });
  });

  it('should handle errors in saveWiggRating with standardized error response', async () => {
    const errorMessage = 'Database insertion failed';
    const mockFrom = {
      insert: vi.fn().mockResolvedValue({ error: { message: errorMessage } })
    };
    (supabase.from as any).mockReturnValue(mockFrom);

    const result = await wiggPersistenceService.saveWiggRating({
      mediaId: 'media-123',
      userId: 'user-456',
      value: 2,
      position: 45,
      positionType: 'sec'
    });

    expect(result.success).toBe(false);
    expect(result.error.message).toBe(errorMessage);
    expect(result.data).toBe(null);
  });

  it('should handle errors in saveMoment with standardized error response', async () => {
    const errorMessage = 'Permission denied';
    const mockFrom = {
      insert: vi.fn().mockResolvedValue({ error: { message: errorMessage } })
    };
    (supabase.from as any).mockReturnValue(mockFrom);

    const result = await wiggPersistenceService.saveMoment({
      mediaId: 'media-123',
      episodeId: 'episode-456',
      userId: 'user-789',
      anchorType: 'timestamp',
      anchorValue: 125,
      whyTags: ['funny'],
      notes: 'Test moment',
      spoilerLevel: 'none'
    });

    expect(result.success).toBe(false);
    expect(result.error.message).toBe(errorMessage);
    expect(result.data).toBe(null);
  });

  it('should save media to database successfully', async () => {
    const mockMediaId = 'media-created-123';
    (supabase.rpc as any).mockResolvedValue({
      data: mockMediaId,
      error: null
    });

    const result = await wiggPersistenceService.saveMediaToDatabase({
      type: 'movie',
      title: 'Test Movie',
      year: 2023,
      duration: 7200,
      chapterCount: null,
      externalIds: { tmdb: '12345' }
    });

    expect(result.success).toBe(true);
    expect(result.data).toBe(mockMediaId);
    expect(supabase.rpc).toHaveBeenCalledWith('upsert_media', {
      p_type: 'movie',
      p_title: 'Test Movie',
      p_year: 2023,
      p_duration_sec: 7200,
      p_pages: null,
      p_external_ids: { tmdb: '12345' }
    });
  });
});