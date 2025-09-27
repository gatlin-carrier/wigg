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
  })),
  getTvDetails: vi.fn(() => Promise.resolve({
    id: 456,
    name: 'Test TV Show',
    overview: 'A detailed test TV show description',
    first_air_date: '2024-01-01',
    number_of_seasons: 3,
    number_of_episodes: 30,
    genres: [{ id: 18, name: 'Drama' }],
    poster_path: '/test-tv.jpg'
  })),
  getTrendingMovies: vi.fn(() => Promise.resolve({
    results: [
      {
        id: 789,
        title: 'Trending Movie',
        overview: 'A popular trending movie',
        release_date: '2024-02-01',
        poster_path: '/trending.jpg'
      }
    ],
    total_results: 1
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

  it('should get detailed TV show information', async () => {
    const details = await mediaClient.getTvDetails(456);

    expect(details.id).toBe(456);
    expect(details.name).toBe('Test TV Show');
    expect(details.number_of_seasons).toBe(3);
    expect(details.number_of_episodes).toBe(30);
    expect(details.genres).toHaveLength(1);
    expect(details.genres[0].name).toBe('Drama');
  });

  it('should get trending movies', async () => {
    const results = await mediaClient.getTrendingMovies();

    expect(results.results).toHaveLength(1);
    expect(results.results[0].id).toBe(789);
    expect(results.results[0].title).toBe('Trending Movie');
  });
});