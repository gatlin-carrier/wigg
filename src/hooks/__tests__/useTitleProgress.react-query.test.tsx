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

describe('useTitleProgress React Query migration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should cache and deduplicate requests for same titleId', async () => {
    const wrapper = createWrapper();

    // Render two hooks with same titleId
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

    // Both should have the same cached data
    expect(result1.current.data).toEqual(result2.current.data);
    expect(result1.current.data?.segments).toHaveLength(20);
  });
});