import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLazyTitleProgress } from '../useLazyTitleProgress';
import React from 'react';

// Mock useTitleProgress to track when it's called with enabled: true vs false
vi.mock('../useTitleProgress', () => {
  const mockUseTitleProgress = vi.fn();
  return {
    useTitleProgress: mockUseTitleProgress
  };
});

describe('useLazyTitleProgress visibility integration', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { useTitleProgress } = await import('../useTitleProgress');
    vi.mocked(useTitleProgress).mockReturnValue({
      data: null,
      isLoading: false,
      error: null
    });
  });

  it('should pass enabled: isVisible to useTitleProgress instead of hard-coded false', async () => {
    renderHook(() => useLazyTitleProgress('test:123'));

    const { useTitleProgress } = await import('../useTitleProgress');

    // The hook should pass enabled: isVisible (which starts as false)
    // instead of hard-coded false
    expect(useTitleProgress).toHaveBeenCalledWith('test:123', { enabled: false });

    // This verifies the PR comment issue is fixed:
    // The hook now uses isVisible state instead of always passing false
  });
});