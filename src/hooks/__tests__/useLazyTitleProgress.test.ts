import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLazyTitleProgress } from '../useLazyTitleProgress';

// Mock useTitleProgress
vi.mock('../useTitleProgress', () => ({
  useTitleProgress: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null
  }))
}));

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});
(window as any).IntersectionObserver = mockIntersectionObserver;

describe('useLazyTitleProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not fetch title progress data until component is visible', async () => {
    const { useTitleProgress } = await import('../useTitleProgress');

    renderHook(() => useLazyTitleProgress('test-title-id'));

    // Should not call useTitleProgress with enabled=true initially
    expect(useTitleProgress).toHaveBeenCalledWith('test-title-id', { enabled: false });
  });

  it('should return elementRef for intersection observer setup', () => {
    const { result } = renderHook(() => useLazyTitleProgress('test-title-id'));

    expect(result.current).toHaveProperty('elementRef');
    expect(typeof result.current.elementRef).toBe('object');
  });

  it('should set up intersection observer in useEffect', () => {
    renderHook(() => useLazyTitleProgress('test-title-id'));

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        rootMargin: '50px',
        threshold: 0.1
      })
    );
  });

  it('should return isVisible state', () => {
    const { result } = renderHook(() => useLazyTitleProgress('test-title-id'));

    expect(result.current).toHaveProperty('isVisible');
    expect(typeof result.current.isVisible).toBe('boolean');
    expect(result.current.isVisible).toBe(false); // Initially not visible
  });
});