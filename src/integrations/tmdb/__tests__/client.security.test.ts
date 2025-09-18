import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * TMDB Client Security Tests
 * 
 * These tests verify that the TMDB client never exposes API keys to the browser
 */

// Mock fetch to test network calls
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('TMDB Client Security', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
      text: async () => 'OK'
    });
  });

  it('should never access VITE_TMDB_API_KEY environment variable', async () => {
    // Mock environment with VITE_TMDB_API_KEY present (security risk)
    vi.stubGlobal('import.meta.env', {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
      VITE_TMDB_API_KEY: 'exposed_api_key_should_not_be_used'
    });

    const { searchMovies } = await import('../client');
    await searchMovies('test movie');

    // Verify the exposed API key was never used
    const fetchCall = mockFetch.mock.calls[0];
    const [url] = fetchCall;
    
    expect(url).not.toContain('exposed_api_key_should_not_be_used');
    expect(url).not.toContain('api_key=');
    expect(url).not.toContain('api.themoviedb.org');
  });

  it('should always route requests through Edge Functions', async () => {
    vi.stubGlobal('import.meta.env', {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test'
    });

    const { searchMovies } = await import('../client');
    await searchMovies('test movie');

    const fetchCall = mockFetch.mock.calls[0];
    const [url] = fetchCall;
    
    // Should always go through Edge Function
    expect(url).toContain('/functions/v1/tmdb');
    expect(url).toContain('.supabase.co');
    expect(url).not.toContain('api.themoviedb.org');
  });
});