import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWiggPersistence } from '../useWiggPersistence';
import { wiggPersistenceService } from '@/lib/api/services/wiggPersistence';

// Mock dependencies
vi.mock('@/lib/api/services/wiggPersistence');
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'user-123'
    }
  })
}));
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn()
}));

const mockWiggPersistenceService = wiggPersistenceService as any;

describe('useWiggPersistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use WIGG Persistence Service instead of direct Supabase calls', async () => {
    mockWiggPersistenceService.saveWiggRating = vi.fn().mockResolvedValue({
      success: true,
      data: null
    });

    const { result } = renderHook(() => useWiggPersistence());

    let saveResult: boolean;
    await act(async () => {
      saveResult = await result.current.saveWiggRating({
        mediaId: 'media-123',
        value: 2,
        position: 45,
        positionType: 'sec'
      });
    });

    expect(mockWiggPersistenceService.saveWiggRating).toHaveBeenCalledWith({
      mediaId: 'media-123',
      userId: 'user-123',
      value: 2,
      position: 45,
      positionType: 'sec'
    });
    expect(saveResult!).toBe(true);
  });
});