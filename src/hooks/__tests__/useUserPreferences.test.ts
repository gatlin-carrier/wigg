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

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

describe('useUserPreferences', () => {
  const mockUser = { id: 'test-user-id' };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: mockUser });
  });

  it('should use shared optimistic update logic for both single and batch operations', async () => {
    const mockFrom = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      upsert: vi.fn().mockResolvedValue({ error: null })
    };

    (supabase.from as any).mockReturnValue(mockFrom);

    const { result } = renderHook(() => useUserPreferences());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Both operations should use the same underlying optimistic update logic
    await result.current.updatePreference('graph_type', 'scatter');
    await result.current.updatePreferences({ rating_ui: 'slider' });

    // Both should have called upsert with user ID
    expect(mockFrom.upsert).toHaveBeenCalledWith({
      id: 'test-user-id',
      graph_type: 'scatter'
    });
    expect(mockFrom.upsert).toHaveBeenCalledWith({
      id: 'test-user-id',
      rating_ui: 'slider'
    });
  });
});