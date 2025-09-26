import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useUserPreferences } from '../useUserPreferences';

// Mock the dependencies
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn()
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn()
  }
}));

vi.mock('@/lib/api/services/userProfile', () => ({
  userProfileService: {
    getUserPreferences: vi.fn(),
    updateUserPreferences: vi.fn()
  }
}));

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { userProfileService } from '@/lib/api/services/userProfile';

describe('useUserPreferences', () => {
  const mockUser = { id: 'test-user-id' };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: mockUser });
  });

  it('should use shared optimistic update logic for both single and batch operations', async () => {
    // Mock User Profile Service responses
    (userProfileService.getUserPreferences as any).mockResolvedValue({
      success: true,
      data: {
        graph_type: 'curve',
        preferred_media_types: [],
        hidden_media_types: [],
        rating_ui: 'buttons'
      }
    });
    (userProfileService.updateUserPreferences as any).mockResolvedValue({ success: true, data: null });

    const { result } = renderHook(() => useUserPreferences());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Both operations should use the same underlying optimistic update logic
    await result.current.updatePreference('graph_type', 'scatter');
    await result.current.updatePreferences({ rating_ui: 'slider' });

    // Both should have called updateUserPreferences with user ID
    expect(userProfileService.updateUserPreferences).toHaveBeenCalledWith('test-user-id', {
      graph_type: 'scatter'
    });
    expect(userProfileService.updateUserPreferences).toHaveBeenCalledWith('test-user-id', {
      rating_ui: 'slider'
    });
  });

  it('should use User Profile Service instead of direct Supabase calls', async () => {
    // Mock the supabase calls for the existing implementation
    const mockFrom = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
    };
    (supabase.from as any).mockReturnValue(mockFrom);

    // Mock successful service responses
    (userProfileService.getUserPreferences as any).mockResolvedValue({
      success: true,
      data: {
        graph_type: 'curve',
        preferred_media_types: [],
        hidden_media_types: [],
        rating_ui: 'buttons'
      }
    });

    renderHook(() => useUserPreferences());

    // Currently this will fail because the hook is still using direct Supabase calls
    // After migration, it should use User Profile Service instead
    expect(userProfileService.getUserPreferences).toHaveBeenCalledWith('test-user-id');
  });
});