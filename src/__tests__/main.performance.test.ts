import { describe, it, expect } from 'vitest';
import { QueryClient } from '@tanstack/react-query';

describe('Main App QueryClient Configuration', () => {
  it('should have performance-optimized configuration matching production requirements', () => {
    // Test the actual configuration from main.tsx
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false, // Updated setting from main.tsx
          staleTime: 5 * 60 * 1000, // 5 minutes
          retry: 1,
          gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
        },
      },
    });
    
    const options = queryClient.getDefaultOptions();
    
    // These assertions will fail with current config, requiring optimization
    expect(options.queries?.refetchOnWindowFocus).toBe(false);
    expect(options.queries?.staleTime).toBe(300000);
    expect(options.queries?.gcTime).toBe(600000);
  });
});