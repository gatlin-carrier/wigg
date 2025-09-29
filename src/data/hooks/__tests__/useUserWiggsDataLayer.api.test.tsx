import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserWiggsDataLayer } from '../useUserWiggsDataLayer';
import React from 'react';

// Mock the auth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ user: { id: 'test-user' } }))
}));

// Mock the client
vi.mock('@/data/clients/wiggPointsClient', () => ({
  wiggPointsClient: {
    getUserWiggPoints: vi.fn(() => Promise.resolve([]))
  }
}));

describe('useUserWiggsDataLayer API compatibility', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should have same API shape as useUserWiggs for MediaTile coexistence', () => {
    const { result } = renderHook(() =>
      useUserWiggsDataLayer('test-media-id', { enabled: true }),
      { wrapper }
    );

    // MediaTile.tsx line 64 expects this API:
    // const { data: wiggsData, addWigg: addWiggLocal } = useNewDataLayer ? newWiggsData : legacyWiggsData;

    // Should have addWigg method
    expect(result.current).toHaveProperty('addWigg');
    expect(typeof result.current.addWigg).toBe('function');

    // Should have data structure compatible with useUserWiggs
    // MediaTile.tsx line 195: wiggsData?.t2gEstimatePct
    if (result.current.data) {
      expect(result.current.data).toHaveProperty('t2gEstimatePct');
      expect(result.current.data).toHaveProperty('entries');
    }
  });
});