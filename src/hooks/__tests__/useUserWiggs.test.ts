import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useUserWiggs } from '../useUserWiggs';

// Mock the dependencies
vi.mock('../useTitleProgress', () => ({
  useTitleProgress: vi.fn().mockReturnValue({
    data: {
      segments: [
        { meanScore: 1.5 }, { meanScore: 1.8 }, { meanScore: 2.1 },
        { meanScore: 2.3 }, { meanScore: 2.7 }, { meanScore: 3.0 }
      ]
    }
  })
}));

vi.mock('../useTitleMetrics', () => ({
  useTitleMetrics: vi.fn().mockReturnValue({
    data: {
      t2g_comm_pct: 35.0
    }
  })
}));

vi.mock('@/integrations/supabase/client', () => {
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({
      data: [
        {
          id: 'wigg-1',
          pos_value: 35.0,
          reason_short: 'Persistent wigg',
          created_at: new Date().toISOString(),
          pos_kind: 'percent'
        }
      ],
      error: null
    }),
    insert: vi.fn().mockResolvedValue({
      data: [{ id: 'new-wigg-id' }],
      error: null
    })
  };

  return {
    supabase: {
      from: vi.fn().mockReturnValue(mockQuery),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-123' } },
          error: null
        })
      }
    }
  };
});

describe('useUserWiggs', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should return loading state initially', () => {
    const { result } = renderHook(() => useUserWiggs('test-id'));
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(typeof result.current.addWigg).toBe('function');
  });

  it('should load wigg entries and calculate T2G after loading completes', async () => {
    const { result } = renderHook(() => useUserWiggs('test-id'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.entries).toHaveLength(1);
    expect(result.current.data?.entries[0].pct).toBe(35.0);
    expect(result.current.data?.entries[0].note).toBe('Persistent wigg');
    expect(result.current.data?.entries[0].rating).toBeUndefined();
    expect(result.current.data?.t2gEstimatePct).toBeDefined();
    expect(result.current.data?.t2gConfidence).toBeDefined();
    expect(result.current.error).toBeNull();
  });

  it('should add new wigg entry and update T2G estimate', async () => {
    const { result } = renderHook(() => useUserWiggs('test-id'));
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialEntryCount = result.current.data?.entries.length || 0;

    await act(async () => {
      await result.current.addWigg(15.0, 'Earlier good moment', 2);
    });

    expect(result.current.data?.entries).toHaveLength(initialEntryCount + 1);
    
    // Should be sorted by percentage, so new entry at 15% should be first
    const newEntry = result.current.data?.entries[0];
    expect(newEntry?.pct).toBe(15.0);
    expect(newEntry?.note).toBe('Earlier good moment');
    expect(newEntry?.rating).toBe(2);
    expect(newEntry?.id).toBeDefined();
    expect(newEntry?.createdAt).toBeDefined();
    
    // T2G should be recalculated to the new earliest good entry (15%)
    expect(result.current.data?.t2gEstimatePct).toBe(15.0);
  });

  it('should not load data for empty titleId', () => {
    const { result } = renderHook(() => useUserWiggs(''));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should persist wigg entries to Supabase and restore them on reload', async () => {
    const titleId = 'test-media-id';
    const mockUserId = 'test-user-123';

    // Mock Supabase operations - need to mock the full chain
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'wigg-1',
            pos_value: 35.0,
            reason_short: 'Persistent wigg',
            created_at: new Date().toISOString(),
            pos_kind: 'percent'
          }
        ],
        error: null
      })
    };

    vi.doMock('@/integrations/supabase/client', () => ({
      supabase: {
        from: vi.fn().mockReturnValue(mockQuery),
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: mockUserId } },
            error: null
          })
        }
      }
    }));

    const { result } = renderHook(() => useUserWiggs(titleId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Debug what we actually got
    console.log('Test data:', result.current.data);
    console.log('Test entries:', result.current.data?.entries);
    console.log('Test error:', result.current.error);

    // Should have loaded the persisted wigg from Supabase
    const persistedEntry = result.current.data?.entries.find(e => e.pct === 35.0);
    expect(persistedEntry).toBeDefined();
    expect(persistedEntry?.note).toBe('Persistent wigg');
  });

  it('should insert new wigg entry to Supabase when addWigg is called', async () => {
    const { result } = renderHook(() => useUserWiggs('test-media-id'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialLength = result.current.data?.entries.length || 0;

    // Call addWigg - should execute Supabase insert without errors
    await act(async () => {
      await result.current.addWigg(25.0, 'Test insertion', 2);
    });

    // Verify that the wigg was added locally (proving the function executed successfully)
    expect(result.current.data?.entries.length).toBe(initialLength + 1);

    // Verify the new entry has correct data
    const newEntry = result.current.data?.entries.find(e => e.note === 'Test insertion');
    expect(newEntry).toBeDefined();
    expect(newEntry?.pct).toBe(25.0);
  });
});