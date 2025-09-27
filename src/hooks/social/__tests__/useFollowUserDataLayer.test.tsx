import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFollowUserDataLayer } from '../useFollowUserDataLayer';

// Mock the auth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-123' } })
}));

describe('useFollowUserDataLayer', () => {
  it('should provide follow functionality using data layer', () => {
    const { result } = renderHook(() =>
      useFollowUserDataLayer('target-user-456')
    );

    expect(result.current).toHaveProperty('isFollowing');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('toggle');
    expect(result.current).toHaveProperty('isOwnProfile');
  });
});