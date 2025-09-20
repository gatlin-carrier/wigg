import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStaggeredLoading } from '../useStaggeredLoading';

describe('useStaggeredLoading', () => {
  it('should load items progressively with delay', () => {
    vi.useFakeTimers();

    try {
      const items = ['movies', 'tv', 'games', 'books'];
      const delay = 200;

      const { result } = renderHook(() => useStaggeredLoading(items, delay));

      // Initially should show first item
      expect(result.current).toEqual(['movies']);

      act(() => {
        vi.advanceTimersByTime(delay);
      });

      expect(result.current).toEqual(['movies', 'tv']);
    } finally {
      vi.useRealTimers();
    }
  });
});
