import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mediaClient } from '../mediaClient';

// Mock TMDB client
vi.mock('@/integrations/tmdb/client', () => ({
  searchMovies: vi.fn(() => Promise.resolve({
    results: [
      {
        id: 123,
        title: 'Test Movie',
        overview: 'A test movie',
        release_date: '2024-01-01',
        poster_path: '/test.jpg'
      }
    ],
    total_results: 1
  })),
  searchMulti: vi.fn(() => Promise.resolve({
    results: [
      {
        id: 456,
        title: 'Test Movie',
        media_type: 'movie',
        release_date: '2024-01-01'
      },
      {
        id: 789,
        name: 'Test TV Show',
        media_type: 'tv',
        first_air_date: '2024-01-01'
      }
    ],
    total_results: 2
  })),
  getMovieDetails: vi.fn(() => Promise.resolve({
    id: 123,
    title: 'Test Movie Details',
    overview: 'A detailed test movie description',
    release_date: '2024-01-01',
    runtime: 120,
    genres: [{ id: 28, name: 'Action' }],
    poster_path: '/test.jpg'
  }))
}));

describe('mediaClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should search for movies', async () => {
    const results = await mediaClient.searchMovies('test query');

    expect(results.results).toHaveLength(1);
    expect(results.results[0].title).toBe('Test Movie');
  });

  it('should search for movies with page parameter', async () => {
    const results = await mediaClient.searchMovies('test query', 2);

    expect(results.results).toHaveLength(1);
    expect(results.results[0].title).toBe('Test Movie');
  });

  it('should perform multi-search across content types', async () => {
    const results = await mediaClient.searchMulti('avengers');

    expect(results.results).toHaveLength(2);
    expect(results.results[0].media_type).toBe('movie');
    expect(results.results[1].media_type).toBe('tv');
  });

  it('should get detailed movie information', async () => {
    const details = await mediaClient.getMovieDetails(123);

    expect(details.id).toBe(123);
    expect(details.title).toBe('Test Movie Details');
    expect(details.runtime).toBe(120);
    expect(details.genres).toHaveLength(1);
    expect(details.genres[0].name).toBe('Action');
  });
});