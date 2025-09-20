import { describe, it, expect } from 'vitest';
import { QueryClient } from '@tanstack/react-query';

describe('QueryClient Performance Configuration', () => {
  it('should disable window refetch and limit retries to 1', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          retry: 1,
        },
      },
    });

    const options = queryClient.getDefaultOptions().queries ?? {};
    expect(options.refetchOnWindowFocus).toBe(false);
    expect(options.retry).toBe(1);
  });
});
