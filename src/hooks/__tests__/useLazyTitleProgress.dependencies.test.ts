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
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: mockObserve,
  unobserve: vi.fn(),
  disconnect: mockDisconnect,
});
(window as any).IntersectionObserver = mockIntersectionObserver;

describe('useLazyTitleProgress dependencies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should set up intersection observer when elementRef is assigned', () => {
    const { result } = renderHook(() => useLazyTitleProgress('test-title-id'));

    // Initially, observer should not be called because element is null
    expect(mockIntersectionObserver).not.toHaveBeenCalled();

    // Simulate assigning a DOM element to elementRef
    const mockElement = document.createElement('div');
    act(() => {
      result.current.elementRef(mockElement);
    });

    // Now the observer should be set up
    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        rootMargin: '50px',
        threshold: 0.1
      })
    );
    expect(mockObserve).toHaveBeenCalledWith(mockElement);
  });
});