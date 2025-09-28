import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWiggPointsData } from '../useWiggPoints';

// Mock the auth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-123' }
  })
}));

// Mock the wigg points client
vi.mock('@/data/clients/wiggPointsClient', () => ({
  wiggPointsClient: {
    getUserWiggPoints: vi.fn().mockResolvedValue([]),
    createWiggPoint: vi.fn().mockImplementation((data) => {
      if (!data.user_id || !data.media_id) {
        throw new Error('Missing required user_id or media_id');
      }
      return Promise.resolve({
        id: 'new-point',
        ...data,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      });
    })
  }
}));

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({})
  }
}));

describe('useWiggPointsData Context Injection', () => {
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

  it('should automatically inject user_id and media_id context when adding wigg point', async () => {
    const { result } = renderHook(
      () => useWiggPointsData('media-456'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const wiggData = {
      pos_value: 1500,
      pos_kind: 'timestamp',
      reason_short: 'Great scene',
      spoiler_level: 1
    };

    await result.current.addWiggPoint(wiggData);

    const { wiggPointsClient } = await import('@/data/clients/wiggPointsClient');
    expect(wiggPointsClient.createWiggPoint).toHaveBeenCalledWith({
      ...wiggData,
      user_id: 'user-123',
      media_id: 'media-456'
    });
  });
});