import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTitleMetrics } from '../useTitleMetrics';

// Mock the Supabase client
vi.mock('@/integrations/supabase/client', () => {
  const mockSelect = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockReturnThis();
  const mockLimit = vi.fn();

  return {
    supabase: {
      from: vi.fn().mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        limit: mockLimit
      })
    }
  };
});

describe('useTitleMetrics Performance', () => {
  let queryClient: QueryClient;

  beforeEach(async () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    vi.clearAllMocks();

    // Access the mocked functions and set up successful response
    const { supabase } = await import('@/integrations/supabase/client');
    const mockQuery = supabase.from().select().eq().limit;
    (mockQuery as any).mockResolvedValue({
      data: [{ title_id: 'test-title', t2g_comm_pct: 85.5 }],
      error: null
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('should cache results and make only one API call for same titleId', async () => {
    const titleId = 'test-title';

    // First hook instance
    const { result: result1 } = renderHook(
      () => useTitleMetrics(titleId),
      { wrapper }
    );

    // Wait for first query to complete
    await vi.waitFor(() => {
      expect(result1.current.loading).toBe(false);
    });

    // Second hook instance with same titleId
    const { result: result2 } = renderHook(
      () => useTitleMetrics(titleId),
      { wrapper }
    );

    // Wait for second query
    await vi.waitFor(() => {
      expect(result2.current.loading).toBe(false);
    });

    // Should only make one API call due to caching
    const { supabase } = await import('@/integrations/supabase/client');
    const mockQuery = supabase.from().select().eq().limit;
    expect(mockQuery).toHaveBeenCalledTimes(1);

    // Both hooks should have the same data
    expect(result1.current.data).toEqual(result2.current.data);
    expect(result2.current.data?.title_id).toBe('test-title');
  });
});