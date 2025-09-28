import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTitleProgress } from '../useTitleProgress';

// Mock feature flags
vi.mock('@/lib/featureFlags', () => ({
  useFeatureFlag: vi.fn()
}));

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

describe('useTitleProgress with feature flags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use React Query when feature flag is enabled', async () => {
    const { useFeatureFlag } = await import('@/lib/featureFlags');
    (useFeatureFlag as any).mockReturnValue(true);

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

    // When using React Query, both should have identical cached data
    expect(result1.current.data).toEqual(result2.current.data);
    expect(useFeatureFlag).toHaveBeenCalledWith('title-progress-react-query');
  });
});