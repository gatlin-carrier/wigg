import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWiggCommentsDataLayer } from '../useWiggCommentsDataLayer';
import { socialClient } from '../../../data/clients/socialClient';

// Mock the social client
vi.mock('../../../data/clients/socialClient', () => ({
  socialClient: {
    getComments: vi.fn(() => Promise.resolve([
      { id: 'comment-1', userId: 'user-1', username: 'testuser', content: 'Test comment', createdAt: '2024-01-01' }
    ])),
    addComment: vi.fn(() => Promise.resolve({ success: true, data: null })),
    deleteComment: vi.fn(() => Promise.resolve({ success: true, data: null }))
  }
}));

// Mock auth context
vi.mock('../../useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'test@example.com' }
  })
}));

describe('useWiggCommentsDataLayer', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('should fetch real comments instead of always returning empty list', async () => {
    const { result } = renderHook(
      () => useWiggCommentsDataLayer('point-123'),
      { wrapper }
    );

    // Initially loading should be true
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should show the real comments from socialClient, not empty array
    expect(result.current.comments).toHaveLength(1);
    expect(result.current.comments[0]).toEqual({
      id: 'comment-1',
      userId: 'user-1',
      username: 'testuser',
      content: 'Test comment',
      createdAt: '2024-01-01'
    });
    expect(socialClient.getComments).toHaveBeenCalledWith('point-123');
  });
});