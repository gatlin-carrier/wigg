import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStaggeredLoading } from '../useStaggeredLoading';

describe('useStaggeredLoading', () => {
  it('should load items progressively with delay', async () => {
    vi.useFakeTimers();

    const items = ['movies', 'tv', 'games', 'books'];
    const delay = 200;

    const { result } = renderHook(() => useStaggeredLoading(items, delay));

    // Initially should show first item
    expect(result.current).toEqual(['movies']);

    // After first delay, should show second item
    vi.advanceTimersByTime(delay);
    expect(result.current).toEqual(['movies', 'tv']);

    vi.useRealTimers();
  });
});