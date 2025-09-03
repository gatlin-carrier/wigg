import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWiggPersistence } from '../useWiggPersistence';
import { useAuth } from '../useAuth';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
vi.mock('../useAuth');
vi.mock('@/integrations/supabase/client');
vi.mock('@/hooks/use-toast');

const mockUser = { id: 'user-123', email: 'test@example.com' };

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useWiggPersistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: mockUser });
  });

  it('saves wigg rating successfully', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as any).mockReturnValue({
      insert: mockInsert,
    });

    const { result } = renderHook(() => useWiggPersistence(), {
      wrapper: createWrapper(),
    });

    const rating = {
      unitId: 'ep-1',
      mediaId: 'media-123',
      value: 3 as const,
      position: 1,
      positionType: 'episode' as const,
    };

    let success;
    await act(async () => {
      success = await result.current.saveWiggRating(rating);
    });

    expect(success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith({
      media_id: 'media-123',
      episode_id: undefined,
      user_id: 'user-123',
      pos_kind: 'episode',
      pos_value: 1,
      tags: ['rating_3'],
      reason_short: 'Rated Peak',
      spoiler: '0',
    });
  });

  it('saves moment successfully', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as any).mockReturnValue({
      insert: mockInsert,
    });

    const { result } = renderHook(() => useWiggPersistence(), {
      wrapper: createWrapper(),
    });

    const moment = {
      id: 'moment-1',
      unitId: 'ep-1',
      anchorType: 'timestamp' as const,
      anchorValue: 120,
      whyTags: ['pacing', 'twist'],
      spoilerLevel: 'light' as const,
      notes: 'Great scene',
    };

    const media = {
      id: 'media-123',
      title: 'Test Media',
      type: 'tv' as const,
    };

    let success;
    await act(async () => {
      success = await result.current.saveMoment(moment, media, 'ep-1');
    });

    expect(success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith({
      media_id: 'media-123',
      episode_id: 'ep-1',
      user_id: 'user-123',
      pos_kind: 'sec',
      pos_value: 120,
      tags: ['pacing', 'twist'],
      reason_short: 'Great scene',
      spoiler: '1',
    });
  });

  it('handles save errors gracefully', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ 
      error: new Error('Database error') 
    });
    (supabase.from as any).mockReturnValue({
      insert: mockInsert,
    });

    const { result } = renderHook(() => useWiggPersistence(), {
      wrapper: createWrapper(),
    });

    const rating = {
      unitId: 'ep-1',
      mediaId: 'media-123',
      value: 2 as const,
      position: 1,
      positionType: 'episode' as const,
    };

    let success;
    await act(async () => {
      success = await result.current.saveWiggRating(rating);
    });

    expect(success).toBe(false);
  });

  it('requires authentication', async () => {
    (useAuth as any).mockReturnValue({ user: null });

    const { result } = renderHook(() => useWiggPersistence(), {
      wrapper: createWrapper(),
    });

    const rating = {
      unitId: 'ep-1',
      mediaId: 'media-123',
      value: 2 as const,
      position: 1,
      positionType: 'episode' as const,
    };

    let success;
    await act(async () => {
      success = await result.current.saveWiggRating(rating);
    });

    expect(success).toBe(false);
  });

  it('saves media to database', async () => {
    const mockSelect = vi.fn().mockResolvedValue({ data: null });
    const mockInsert = vi.fn().mockResolvedValue({ 
      data: { id: 'new-media-id' }, 
      error: null 
    });

    (supabase.from as any).mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () => ({
            eq: () => ({
              single: mockSelect
            })
          })
        })
      }),
      insert: () => ({
        select: () => ({
          single: mockInsert
        })
      })
    });

    const { result } = renderHook(() => useWiggPersistence(), {
      wrapper: createWrapper(),
    });

    const media = {
      id: 'temp-id',
      title: 'New Anime',
      type: 'anime' as const,
      year: 2024,
      externalIds: { anilist_id: 12345 },
    };

    let mediaId;
    await act(async () => {
      mediaId = await result.current.saveMediaToDatabase(media);
    });

    expect(mediaId).toBe('new-media-id');
  });
});