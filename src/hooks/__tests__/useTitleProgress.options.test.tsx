import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
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

describe('useTitleProgress options parameter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should accept enabled option parameter', () => {
    const wrapper = createWrapper();

    // This should work without TypeScript errors
    expect(() => {
      renderHook(() => useTitleProgress('test-title', { enabled: false }), { wrapper });
    }).not.toThrow();
  });

  it('should not load data when enabled is false', () => {
    const wrapper = createWrapper();

    const { result } = renderHook(
      () => useTitleProgress('test-title', { enabled: false }),
      { wrapper }
    );

    // Should remain in loading state and not fetch data when disabled
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBe(null);
  });
});