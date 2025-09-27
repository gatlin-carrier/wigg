import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useWiggPointsData } from '../useWiggPoints';

// Mock the dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null
      })
    }))
  }
}));

vi.mock('@/data/clients/wiggPointsClient', () => ({
  wiggPointsClient: {
    getUserWiggPoints: vi.fn().mockResolvedValue([
      {
        id: 'client-test-id',
        media_id: 'client-media',
        user_id: 'client-user',
        pos_value: 75,
        pos_kind: 'percent',
        reason_short: 'Client reason',
        spoiler_level: 3,
        created_at: '2024-03-01T00:00:00Z',
        updated_at: '2024-03-01T00:00:00Z'
      }
    ]),
    createWiggPoint: vi.fn().mockResolvedValue({
      id: 'new-wigg-id',
      media_id: 'test-media',
      user_id: 'test-user',
      pos_value: 50,
      pos_kind: 'percent',
      reason_short: 'New wigg point',
      spoiler_level: 1,
      created_at: '2024-03-01T00:00:00Z',
      updated_at: '2024-03-01T00:00:00Z'
    })
  }
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user-id' }
  }))
}));

// Import the mocked modules for type safety
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { wiggPointsClient } from '@/data/clients/wiggPointsClient';

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

describe('useWiggPointsData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch user wigg points for a media', async () => {
    const wrapper = createWrapper();

    const { result } = renderHook(
      () => useWiggPointsData('test-media-id'),
      { wrapper }
    );

    // Should start in loading state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toEqual([]);

    // Wait for the query to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have client data array
    expect(result.current.data).toEqual([
      {
        id: 'client-test-id',
        media_id: 'client-media',
        user_id: 'client-user',
        pos_value: 75,
        pos_kind: 'percent',
        reason_short: 'Client reason',
        spoiler_level: 3,
        created_at: '2024-03-01T00:00:00Z',
        updated_at: '2024-03-01T00:00:00Z'
      }
    ]);
    expect(result.current.error).toBe(null);
  });

  it('should call Supabase to fetch wigg points data', async () => {
    const wrapper = createWrapper();

    const { result } = renderHook(
      () => useWiggPointsData('media-123'),
      { wrapper }
    );

    // Wait for the query to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have called Supabase mock
    expect(supabase.from).toHaveBeenCalledWith('wigg_points');
    expect(result.current.data).toEqual([
      {
        id: 'client-test-id',
        media_id: 'client-media',
        user_id: 'client-user',
        pos_value: 75,
        pos_kind: 'percent',
        reason_short: 'Client reason',
        spoiler_level: 3,
        created_at: '2024-03-01T00:00:00Z',
        updated_at: '2024-03-01T00:00:00Z'
      }
    ]);
    expect(result.current.error).toBe(null);
  });

  it('should use wiggPointsClient instead of direct Supabase calls', async () => {
    const wrapper = createWrapper();

    const { result } = renderHook(
      () => useWiggPointsData('media-123'),
      { wrapper }
    );

    // Wait for the query to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have called the wiggPointsClient
    expect(wiggPointsClient.getUserWiggPoints).toHaveBeenCalledWith('test-user-id', 'media-123');
    expect(result.current.data).toEqual([
      {
        id: 'client-test-id',
        media_id: 'client-media',
        user_id: 'client-user',
        pos_value: 75,
        pos_kind: 'percent',
        reason_short: 'Client reason',
        spoiler_level: 3,
        created_at: '2024-03-01T00:00:00Z',
        updated_at: '2024-03-01T00:00:00Z'
      }
    ]);
    expect(result.current.error).toBe(null);
  });

  it('should return data from wiggPointsClient', async () => {
    const wrapper = createWrapper();

    const { result } = renderHook(
      () => useWiggPointsData('media-123'),
      { wrapper }
    );

    // Wait for the query to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should return the data from the client
    expect(result.current.data).toEqual([
      {
        id: 'client-test-id',
        media_id: 'client-media',
        user_id: 'client-user',
        pos_value: 75,
        pos_kind: 'percent',
        reason_short: 'Client reason',
        spoiler_level: 3,
        created_at: '2024-03-01T00:00:00Z',
        updated_at: '2024-03-01T00:00:00Z'
      }
    ]);
    expect(result.current.error).toBe(null);
  });

  it('should provide addWiggPoint mutation function', async () => {
    const wrapper = createWrapper();

    const { result } = renderHook(
      () => useWiggPointsData('media-123'),
      { wrapper }
    );

    // Wait for the query to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have addWiggPoint function
    expect(typeof result.current.addWiggPoint).toBe('function');
    expect(result.current.isAdding).toBe(false);
    expect(result.current.addError).toBe(null);
  });

  it('should call wiggPointsClient.createWiggPoint when addWiggPoint is called', async () => {
    const wrapper = createWrapper();

    const { result } = renderHook(
      () => useWiggPointsData('media-123'),
      { wrapper }
    );

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const newWiggData = {
      media_id: 'media-123',
      pos_value: 60,
      pos_kind: 'percent',
      reason_short: 'Test mutation',
      spoiler_level: 2
    };

    // Call the mutation
    await result.current.addWiggPoint(newWiggData);

    // Should have called the client's createWiggPoint method
    expect(wiggPointsClient.createWiggPoint).toHaveBeenCalledWith(newWiggData);
  });

  it('should handle loading states correctly during mutation', async () => {
    const wrapper = createWrapper();

    const { result } = renderHook(
      () => useWiggPointsData('media-123'),
      { wrapper }
    );

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Initially not adding
    expect(result.current.isAdding).toBe(false);
    expect(result.current.addError).toBe(null);

    const newWiggData = {
      media_id: 'media-123',
      pos_value: 60,
      pos_kind: 'percent',
      reason_short: 'Test mutation',
      spoiler_level: 2
    };

    // Call the mutation
    await result.current.addWiggPoint(newWiggData);

    // Should have completed the mutation
    expect(result.current.isAdding).toBe(false);
    expect(result.current.addError).toBe(null);
  });
});