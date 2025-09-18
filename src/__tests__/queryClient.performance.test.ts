import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';

describe('QueryClient Performance', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          staleTime: 5 * 60 * 1000,
          retry: 1,
        },
      },
    });
  });

  it('should have optimized default options for performance', () => {
    const defaultOptions = queryClient.getDefaultOptions();
    
    expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(false);
    expect(defaultOptions.queries?.staleTime).toBe(300000); // 5 minutes
    expect(defaultOptions.queries?.retry).toBe(1);
  });
});