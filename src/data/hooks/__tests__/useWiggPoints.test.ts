import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useWiggPointsData } from '../useWiggPoints';

// Mock the dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null
      })
    }))
  }
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user-id' }
  }))
}));

// Import the mocked modules for type safety
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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

describe('useWiggPointsData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch user wigg points for a media', async () => {
    const wrapper = createWrapper();

    const { result } = renderHook(
      () => useWiggPointsData('test-media-id'),
      { wrapper }
    );

    // Should start in loading state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toEqual([]);

    // Wait for the query to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have empty data array
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBe(null);
  });

  it('should call Supabase to fetch wigg points data', async () => {
    const wrapper = createWrapper();

    const { result } = renderHook(
      () => useWiggPointsData('media-123'),
      { wrapper }
    );

    // Wait for the query to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have called Supabase mock
    expect(supabase.from).toHaveBeenCalledWith('wigg_points');
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBe(null);
  });
});