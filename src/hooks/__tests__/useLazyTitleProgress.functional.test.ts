import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
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
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
const mockIntersectionObserver = vi.fn().mockReturnValue({
  observe: mockObserve,
  unobserve: vi.fn(),
  disconnect: mockDisconnect,
});
(window as any).IntersectionObserver = mockIntersectionObserver;

describe('useLazyTitleProgress functional behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should observe element when elementRef is set', () => {
    const { result } = renderHook(() => useLazyTitleProgress('test-title-id'));

    // Simulate setting the ref to an element using the callback
    const mockElement = document.createElement('div');
    act(() => {
      result.current.elementRef(mockElement);
    });

    // Should have called observe on the element
    expect(mockObserve).toHaveBeenCalledWith(mockElement);
  });
});