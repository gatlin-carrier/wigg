import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useMediaDataLayer } from '../useMediaDataLayer';

// Mock the media client
vi.mock('@/data/clients/mediaClient', () => ({
  mediaClient: {
    getMediaById: vi.fn().mockResolvedValue({
      success: true,
      data: {
        id: 'media-123',
        title: 'Test Movie',
        type: 'movie',
        year: 2024,
        created_at: '2024-01-01T00:00:00Z'
      }
    }),
    createMedia: vi.fn(),
    updateMedia: vi.fn(),
    deleteMedia: vi.fn()
  }
}));

// Helper to create query client wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );
};

describe('useMediaDataLayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch media by ID using data layer client', async () => {
    const wrapper = createWrapper();

    const { result } = renderHook(
      () => useMediaDataLayer('media-123'),
      { wrapper }
    );

    // Should start in loading state
    expect(result.current.isLoading).toBe(true);

    // Wait for the query to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have fetched data using the client
    expect(result.current.data).toBeDefined();
    expect(result.current.data!.id).toBe('media-123');
    expect(result.current.data!.title).toBe('Test Movie');
    expect(result.current.error).toBe(null);
  });
});