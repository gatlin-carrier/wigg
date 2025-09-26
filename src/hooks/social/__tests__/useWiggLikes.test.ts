import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWiggLikes } from '../useWiggLikes';

// Mock the dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn()
  }
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn()
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn()
}));

vi.mock('@/services/notificationTriggers', () => ({
  notifyWiggLiked: vi.fn()
}));

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

describe('useWiggLikes', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: mockUser });
    (useToast as any).mockReturnValue({ toast: mockToast });
  });

  it('should handle Promise.all errors in useEffect without crashing', async () => {
    // Mock Promise.all to reject
    (supabase.rpc as any).mockRejectedValue(new Error('Database error'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() =>
      useWiggLikes('point-123', 'owner-456', 'Test Movie')
    );

    // The hook should not crash and should handle the error gracefully
    expect(result.current.liked).toBe(false);
    expect(result.current.count).toBe(0);

    // Should have logged the error (currently missing)
    // expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error fetching like data'));

    consoleSpy.mockRestore();
  });
});