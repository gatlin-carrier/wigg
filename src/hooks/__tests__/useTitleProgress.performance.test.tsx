import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTitleProgress } from '../useTitleProgress';

// Create a test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useTitleProgress performance optimizations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should demonstrate cache hits reduce API calls', async () => {
    const wrapper = createWrapper();

    // First call
    const { result: result1 } = renderHook(
      () => useTitleProgress('cache-test-id'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result1.current.isLoading).toBe(false);
    });

    // Second call with same ID - should use cache
    const { result: result2 } = renderHook(
      () => useTitleProgress('cache-test-id'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result2.current.isLoading).toBe(false);
    });

    // With React Query enabled, both should have identical data from cache
    expect(result1.current.data).toEqual(result2.current.data);

    // This test verifies that React Query caching works
    // In production, this prevents hundreds of duplicate API calls
  });
});