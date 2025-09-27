import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserWiggsDataLayer } from '../useUserWiggsDataLayer';

// Mock the data layer client
vi.mock('../../data/clients/wiggPointsClient', () => ({
  wiggPointsClient: {
    getUserWiggPoints: vi.fn(() => Promise.resolve({
      success: true,
      data: [
        {
          id: 'wigg-1',
          media_id: 'media-123',
          user_id: 'user-456',
          pos_value: 25,
          pos_kind: 'percent',
          reason_short: 'Great opening scene',
          spoiler_level: 0,
          created_at: '2024-03-01T00:00:00Z',
          updated_at: '2024-03-01T00:00:00Z'
        },
        {
          id: 'wigg-2',
          media_id: 'media-123',
          user_id: 'user-456',
          pos_value: 75,
          pos_kind: 'percent',
          reason_short: 'Amazing climax',
          spoiler_level: 1,
          created_at: '2024-03-01T01:00:00Z',
          updated_at: '2024-03-01T01:00:00Z'
        }
      ]
    })),
    createWiggPoint: vi.fn(() => Promise.resolve({
      success: true,
      data: {
        id: 'new-wigg',
        media_id: 'media-123',
        user_id: 'user-456',
        pos_value: 50,
        pos_kind: 'percent',
        reason_short: 'New wigg point',
        spoiler_level: 0,
        created_at: '2024-03-01T02:00:00Z',
        updated_at: '2024-03-01T02:00:00Z'
      }
    }))
  }
}));

// Mock auth context
vi.mock('../useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-456' }
  })
}));

describe('Migration: useUserWiggsDataLayer', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('should provide same interface as legacy useUserWiggs hook', async () => {
    const { result } = renderHook(
      () => useUserWiggsDataLayer('media-123'),
      { wrapper }
    );

    // Should match the legacy hook interface
    expect(result.current).toMatchObject({
      data: expect.any(Object),
      isLoading: expect.any(Boolean),
      error: null,
      addWigg: expect.any(Function)
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should transform data to match legacy format
    expect(result.current.data).toEqual({
      entries: [
        {
          id: 'wigg-1',
          pct: 25,
          note: 'Great opening scene',
          createdAt: '2024-03-01T00:00:00Z',
          rating: undefined
        },
        {
          id: 'wigg-2',
          pct: 75,
          note: 'Amazing climax',
          createdAt: '2024-03-01T01:00:00Z',
          rating: undefined
        }
      ],
      t2gEstimatePct: undefined,
      t2gConfidence: undefined
    });
  });

  it('should handle addWigg mutation with new data layer', async () => {
    const { result } = renderHook(
      () => useUserWiggsDataLayer('media-123'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.addWigg).toBeDefined();
    expect(typeof result.current.addWigg).toBe('function');
  });
});