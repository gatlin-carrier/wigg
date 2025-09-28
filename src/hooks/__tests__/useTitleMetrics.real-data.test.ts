import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTitleMetrics } from '../useTitleMetrics';
import React from 'react';

vi.mock('@/integrations/supabase/client', () => {
  const mockSupabase = {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({
            data: [{
              title_id: 'tmdb:123',
              t2g_comm_pct: 45.5,
              t2g_comm_iqr: 12.3,
              peak_label: 'Peak mid',
              peak_at_pct: 55.0,
              sample_size: 15,
              updated_at: '2025-09-28T10:00:00Z'
            }],
            error: null
          }))
        }))
      }))
    }))
  };

  return { supabase: mockSupabase };
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } }
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useTitleMetrics with real data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return real metrics data from title_metrics table', async () => {
    const { result } = renderHook(
      () => useTitleMetrics('tmdb:123'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual({
      title_id: 'tmdb:123',
      t2g_comm_pct: 45.5,
      t2g_comm_iqr: 12.3,
      peak_label: 'Peak mid',
      peak_at_pct: 55.0,
      sample_size: 15,
      updated_at: '2025-09-28T10:00:00Z'
    });

    // Verify it queries the real title_metrics table
    const { supabase } = await import('@/integrations/supabase/client');
    expect(supabase.from).toHaveBeenCalledWith('title_metrics');
  });
});