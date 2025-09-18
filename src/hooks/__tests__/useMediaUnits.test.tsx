import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import { useMediaUnits } from '../useMediaUnits';
import type { MediaSearchResult } from '@/components/media/MediaSearch';

// Mock the integration modules
vi.mock('@/integrations/tmdb/client', () => ({
  getTvEpisodes: vi.fn().mockResolvedValue([]),
}));

// Create a wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useMediaUnits', () => {
  it('should return empty units for null media', () => {
    const { result } = renderHook(() => useMediaUnits(null), {
      wrapper: createWrapper(),
    });
    
    expect(result.current.units).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should generate fallback episodes for TV media without TMDB ID', async () => {
    const tvMedia: MediaSearchResult = {
      id: 'tv-123',
      title: 'Test TV Show',
      type: 'tv',
      year: 2023,
    };

    const { result } = renderHook(() => useMediaUnits(tvMedia), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.units).toHaveLength(12); // Default fallback episode count
    expect(result.current.units[0].title).toBe('Episode 1');
    expect(result.current.units[0].subtype).toBe('episode');
    expect(result.current.units[0].runtimeSec).toBe(24 * 60); // 24 minutes
  });

  it('should generate book chapters with meaningful titles', async () => {
    const bookMedia: MediaSearchResult = {
      id: 'book-456',
      title: 'Test Book',
      type: 'book',
      year: 2023,
    };

    const { result } = renderHook(() => useMediaUnits(bookMedia), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.units).toHaveLength(12); // Default chapter count
    expect(result.current.units[0].title).toBe('Chapter 1: Introduction');
    expect(result.current.units[1].title).toBe('Chapter 2: The Beginning');
    expect(result.current.units[0].subtype).toBe('chapter');
    expect(result.current.units[0].pages).toBeGreaterThan(0);
  });

  it('should generate single unit for movie media', async () => {
    const movieMedia: MediaSearchResult = {
      id: 'movie-789',
      title: 'Test Movie',
      type: 'movie',
      year: 2023,
      duration: 120 * 60, // 2 hours in seconds
    };

    const { result } = renderHook(() => useMediaUnits(movieMedia), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.units).toHaveLength(1);
    expect(result.current.units[0].title).toBe('Test Movie');
    expect(result.current.units[0].subtype).toBe('episode');
    expect(result.current.units[0].runtimeSec).toBe(120 * 60);
  });
});