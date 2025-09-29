import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useUserWiggsDataLayer } from '../useUserWiggsDataLayer';

// Mock the data layer client
vi.mock('@/data/clients/wiggPointsClient', () => ({
  wiggPointsClient: {
    getUserWiggPoints: vi.fn().mockResolvedValue([
      {
        id: 'test-id-1',
        mediaId: 'media-123',
        userId: 'user-456',
        posValue: 30,
        posKind: 'percent',
        reasonShort: 'Test reason',
        spoilerLevel: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    ])
  }
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-456' }
  }))
}));

// Helper to create query client wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );
};

describe('useUserWiggsDataLayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use data layer client instead of direct Supabase calls', async () => {
    const wrapper = createWrapper();

    const { result } = renderHook(
      () => useUserWiggsDataLayer('media-123'),
      { wrapper }
    );

    // Should start in loading state
    expect(result.current.isLoading).toBe(true);

    // Wait for the query to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have fetched data using the client and transformed to useUserWiggs-compatible format
    expect(result.current.data).toBeDefined();
    expect(result.current.data!.entries).toHaveLength(1);
    expect(result.current.data!.entries[0]).toEqual({
      id: 'test-id-1',
      pct: 30,
      note: 'Test reason',
      rating: undefined,
      createdAt: '2024-01-01T00:00:00Z'
    });
    expect(result.current.data).toHaveProperty('t2gEstimatePct');
    expect(result.current.error).toBe(null);
  });
});