import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRecentWiggPoints } from '../useRecentWiggPoints';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    }))
  }
}));

// Mock useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'test-user' } })
}));

describe('useRecentWiggPoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty entries initially', () => {
    const { result } = renderHook(() => useRecentWiggPoints());

    expect(result.current.entries).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
  });
});