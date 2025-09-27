import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWiggComments } from '../useWiggComments';
import { socialService } from '@/lib/api/services/social';

// Mock dependencies
vi.mock('@/lib/api/services/social');
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-123' } })
}));
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() })
}));

const mockSocialService = socialService as any;

describe('useWiggComments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use social service instead of direct Supabase calls', async () => {
    const mockComments = [
      {
        id: 'comment-1',
        userId: 'user-456',
        username: 'testuser',
        content: 'Great point!',
        createdAt: '2024-01-01T00:00:00Z'
      }
    ];

    mockSocialService.getComments = vi.fn().mockResolvedValue({
      success: true,
      data: mockComments
    });

    const { result } = renderHook(() => useWiggComments('point-123'));

    // Wait for the hook to call the service
    await waitFor(() => {
      expect(mockSocialService.getComments).toHaveBeenCalledWith('point-123');
    });

    expect(mockSocialService.getComments).toHaveBeenCalledWith('point-123');
    expect(result.current.comments).toEqual(mockComments);
  });
});