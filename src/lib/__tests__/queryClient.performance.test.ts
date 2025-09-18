import { describe, it, expect } from 'vitest';
import { QueryClient } from '@tanstack/react-query';

describe('QueryClient Performance Configuration', () => {
  it('should have optimized default stale time for better performance', () => {
    // Create QueryClient with current configuration from main.tsx
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          retry: 1,
        },
      },
    });

    const defaultStaleTime = queryClient.getDefaultOptions().queries?.staleTime;

    // Should be at least 5 minutes for better performance
    expect(defaultStaleTime).toBeGreaterThanOrEqual(5 * 60 * 1000);
  });
});