import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
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

describe('useUserWiggs', () => {
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
    expect(result.current.data?.entries).toHaveLength(3);
    expect(result.current.data?.entries[0].pct).toBe(25.5);
    expect(result.current.data?.entries[0].note).toBe('Story picks up here');
    expect(result.current.data?.entries[0].rating).toBe(1);
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
});