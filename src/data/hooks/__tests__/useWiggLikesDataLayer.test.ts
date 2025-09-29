import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWiggLikesDataLayer } from '../useWiggLikesDataLayer';

describe('useWiggLikesDataLayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should accept enabled options parameter to prevent duplicate API calls', () => {
    // This test will fail because the hook doesn't exist yet
    const { result } = renderHook(() =>
      useWiggLikesDataLayer('test-point-id', { enabled: false })
    );

    expect(result.current).toBeDefined();
    expect(result.current.liked).toBeDefined();
    expect(result.current.count).toBeDefined();
    expect(result.current.loading).toBeDefined();
    expect(result.current.toggleLike).toBeDefined();
  });
});