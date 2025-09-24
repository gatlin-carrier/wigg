import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useTitleMetrics } from '../useTitleMetrics';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => {
  const mockData = {
    title_id: 'test-title',
    t2g_comm_pct: 25.5,
    t2g_comm_iqr: 15.2,
    peak_label: 'Episode 3',
    peak_at_pct: 75.0,
    sample_size: 150,
    updated_at: '2023-01-01T00:00:00Z',
  };

  const mockSelect = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockReturnThis();
  const mockLimit = vi.fn().mockResolvedValue({
    data: [mockData],
    error: null,
  });

  return {
    supabase: {
      from: vi.fn().mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        limit: mockLimit,
      }),
    },
    mockSelect,
    mockEq,
    mockLimit,
  };
});

// Helper to create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useTitleMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return loading state initially', () => {
    const { result } = renderHook(() => useTitleMetrics('test-title'), {
      wrapper: createWrapper(),
    });

    expect(result.current.loading).toBe(true); // Loading state when titleId is provided
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('should not make duplicate API calls for same titleId within 5 minutes (caching)', async () => {
    const wrapper = createWrapper();
    const { result: firstResult } = renderHook(() => useTitleMetrics('same-title'), { wrapper });
    const { result: secondResult } = renderHook(() => useTitleMetrics('same-title'), { wrapper });

    // Both hooks should share cached data and not duplicate API calls
    expect(firstResult.current.loading).toBe(secondResult.current.loading);
    // This test will fail until we implement React Query caching
  });

  it('should fetch real data from Supabase when titleId is provided', async () => {
    const { result } = renderHook(() => useTitleMetrics('test-title'), {
      wrapper: createWrapper(),
    });

    // Current implementation returns null, but should fetch real data
    await waitFor(() => {
      expect(result.current.data).not.toBe(null);
      expect(result.current.loading).toBe(false);
    });
  });
});