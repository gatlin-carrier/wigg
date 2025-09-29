import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useUserWiggsDataLayer } from '../useUserWiggsDataLayer';
import { wiggPointsClient } from '@/data/clients/wiggPointsClient';

// Mock the data layer client
vi.mock('@/data/clients/wiggPointsClient', () => ({
  wiggPointsClient: {
    getUserWiggPoints: vi.fn().mockResolvedValue([
      {
        id: 'test-id-1',
        media_id: 'media-123',
        user_id: 'user-456',
        pos_value: 30,
        pos_kind: 'percent',
        reason_short: 'Test reason',
        spoiler_level: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ]),
    createWiggPoint: vi.fn()
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

describe('useUserWiggsDataLayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use data layer client instead of direct Supabase calls', async () => {
    const wrapper = createWrapper();

    const { result } = renderHook(
      () => useUserWiggsDataLayer('media-123'),
      { wrapper }
    );

    // Should start in loading state
    expect(result.current.isLoading).toBe(true);

    // Wait for the query to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have fetched data using the client and transformed to useUserWiggs-compatible format
    expect(result.current.data).toBeDefined();
    expect(result.current.data!.entries).toHaveLength(1);
    expect(result.current.data!.entries[0]).toEqual({
      id: 'test-id-1',
      pct: 30,
      note: 'Test reason',
      rating: undefined,
      createdAt: '2024-01-01T00:00:00Z'
    });
    expect(result.current.data).toHaveProperty('t2gEstimatePct');
    expect(result.current.error).toBe(null);
  });

  it('should calculate T2G estimate from wigg entries', async () => {
    const wrapper = createWrapper();

    const { result } = renderHook(
      () => useUserWiggsDataLayer('media-123'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should calculate T2G using analysis functions
    expect(result.current.data!.t2gEstimatePct).toBe(35); // Default value from pickT2G when no good ratings
    expect(result.current.data!.t2gConfidence).toBe(0.3); // Default confidence
  });

  it('should implement addWigg using data layer client', async () => {
    const mockCreateWiggPoint = vi.fn().mockResolvedValue({
      id: 'new-wigg-id',
      media_id: 'media-123',
      user_id: 'user-456',
      pos_value: 75,
      pos_kind: 'percent',
      reason_short: 'Test note',
      spoiler_level: 1,
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z'
    });

    vi.mocked(wiggPointsClient).createWiggPoint = mockCreateWiggPoint;

    const wrapper = createWrapper();

    const { result } = renderHook(
      () => useUserWiggsDataLayer('media-123'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should call createWiggPoint with correct parameters
    await result.current.addWigg(75, 'Test note', 4);

    expect(mockCreateWiggPoint).toHaveBeenCalledWith({
      media_id: 'media-123',
      user_id: 'user-456',
      pos_value: 75,
      pos_kind: 'percent',
      reason_short: 'Test note',
      spoiler_level: 0, // Default spoiler level
    });
  });

  it('should allow configurable spoiler level in addWigg', async () => {
    const mockCreateWiggPoint = vi.fn().mockResolvedValue({
      id: 'new-wigg-id',
      media_id: 'media-123',
      user_id: 'user-456',
      pos_value: 60,
      pos_kind: 'percent',
      reason_short: 'Spoiler note',
      spoiler_level: 2,
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z'
    });

    vi.mocked(wiggPointsClient).createWiggPoint = mockCreateWiggPoint;

    const wrapper = createWrapper();

    const { result } = renderHook(
      () => useUserWiggsDataLayer('media-123'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should call createWiggPoint with custom spoiler level
    await result.current.addWigg(60, 'Spoiler note', 4, 2);

    expect(mockCreateWiggPoint).toHaveBeenCalledWith({
      media_id: 'media-123',
      user_id: 'user-456',
      pos_value: 60,
      pos_kind: 'percent',
      reason_short: 'Spoiler note',
      spoiler_level: 2, // Custom spoiler level
    });
  });
});