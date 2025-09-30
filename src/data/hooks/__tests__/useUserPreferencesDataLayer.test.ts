import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useUserPreferencesDataLayer } from '../useUserPreferencesDataLayer';

// Mock the user preferences client
vi.mock('@/data/clients/userPreferencesClient', () => ({
  userPreferencesClient: {
    getUserPreferences: vi.fn().mockResolvedValue({
      success: true,
      data: {
        id: 'pref-123',
        user_id: 'user-456',
        spoiler_sensitivity: 1,
        trusted_users: ['user-789'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    }),
    updateUserPreferences: vi.fn()
  }
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-456' }
  }))
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

describe('useUserPreferencesDataLayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch user preferences using data layer client', async () => {
    const wrapper = createWrapper();

    const { result } = renderHook(
      () => useUserPreferencesDataLayer(),
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
    expect(result.current.data!.user_id).toBe('user-456');
    expect(result.current.data!.spoiler_sensitivity).toBe(1);
    expect(result.current.error).toBe(null);
  });
});