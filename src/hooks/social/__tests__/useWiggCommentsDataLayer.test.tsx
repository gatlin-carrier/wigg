import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWiggCommentsDataLayer } from '../useWiggCommentsDataLayer';

// Mock the auth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-123' } })
}));

describe('useWiggCommentsDataLayer', () => {
  it('should provide basic interface', () => {
    const { result } = renderHook(() =>
      useWiggCommentsDataLayer('point-456')
    );

    expect(result.current).toHaveProperty('comments');
    expect(result.current).toHaveProperty('loading');
  });

  it('should provide complete interface matching useWiggComments', () => {
    const { result } = renderHook(() =>
      useWiggCommentsDataLayer('point-456')
    );

    // Should match the interface of useWiggComments
    expect(result.current).toHaveProperty('addComment');
    expect(result.current).toHaveProperty('deleteComment');
    expect(result.current).toHaveProperty('refresh');
    expect(result.current).toHaveProperty('canComment');
  });
});