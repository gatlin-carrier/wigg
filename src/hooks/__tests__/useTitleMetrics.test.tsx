import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
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

describe('useTitleMetrics', () => {
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

  it('should fetch title metrics for valid titleId', async () => {
    const mockData = {
      title_id: 'test-title',
      t2g_comm_pct: 85.5,
      t2g_comm_iqr: 12.3,
      peak_label: 'climax',
      peak_at_pct: 75.0,
      sample_size: 150,
      updated_at: '2024-01-01T00:00:00Z'
    };

    const { supabase } = await import('@/integrations/supabase/client');
    const mockQuery = supabase.from().select().eq().limit;
    (mockQuery as any).mockResolvedValue({ data: [mockData], error: null });

    const { result } = renderHook(
      () => useTitleMetrics('test-title'),
      { wrapper }
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBe(null);
  });
});