import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAnalyticsWorker } from '../useAnalyticsWorker';

describe('useAnalyticsWorker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with worker support detection', () => {
    const { result } = renderHook(() => useAnalyticsWorker());
    
    expect(result.current).toMatchObject({
      isSupported: expect.any(Boolean),
      track: expect.any(Function),
      page: expect.any(Function),
    });
  });
});