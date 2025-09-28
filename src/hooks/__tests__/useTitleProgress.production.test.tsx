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

describe('useTitleProgress production behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use React Query by default for performance optimization', async () => {
    const wrapper = createWrapper();

    // Render two hooks with same titleId - should get identical cached data
    const { result: result1 } = renderHook(
      () => useTitleProgress('same-title-id'),
      { wrapper }
    );
    const { result: result2 } = renderHook(
      () => useTitleProgress('same-title-id'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result1.current.isLoading).toBe(false);
      expect(result2.current.isLoading).toBe(false);
    });

    // Should have identical data from cache (React Query behavior)
    expect(result1.current.data).toEqual(result2.current.data);
  });
});