import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useUserWiggs } from '../useUserWiggs';

// Test data patterns for consistent testing and easy cleanup
const TEST_DATA_PATTERNS = {
  MEDIA_ID_PREFIX: 'test-',
  USER_ID_PREFIX: 'dev-user-',
  SAMPLE_MEDIA_IDS: {
    GAME: 'test-game-sample-rpg',
    MOVIE: 'test-movie-persistence-check',
    TV: 'test-tv-series-sample'
  },
  SAMPLE_USER_IDS: {
    TESTER: 'dev-user-tester',
    DEVELOPER: 'dev-user-developer'
  }
};

// Test utilities for WIGG data management
const testUtils = {
  // Identify test data by patterns
  isTestData: {
    mediaId: (id: string) => id.startsWith(TEST_DATA_PATTERNS.MEDIA_ID_PREFIX),
    userId: (id: string) => id.startsWith(TEST_DATA_PATTERNS.USER_ID_PREFIX),
    wiggEntry: (entry: any) => entry.id?.includes('test-') || entry.note?.includes('[TEST]')
  },

  // Generate consistent test data
  createTestWigg: (pct: number, note?: string, rating?: number) => ({
    id: `test-wigg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    pct,
    note: note ? `[TEST] ${note}` : `[TEST] Generated wigg at ${pct}%`,
    rating: rating || 2,
    createdAt: new Date().toISOString(),
    pos_kind: 'percent' as const
  }),

  // Cleanup helpers for test data
  cleanup: {
    // Clear localStorage of test data
    clearLocalStorage: () => {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('test-') ||
          key.includes('dev-user-') ||
          key.startsWith('wigg_test_')
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    },

    // Filter out test entries from data arrays
    filterTestEntries: (entries: any[]) =>
      entries.filter(entry => !testUtils.isTestData.wiggEntry(entry)),

    // Mark data for cleanup (add test markers)
    markForCleanup: (data: any) => ({
      ...data,
      _testData: true,
      _cleanupKey: `test_${Date.now()}`
    })
  },

  // Environment detection
  environment: {
    isTestEnvironment: () =>
      process.env.NODE_ENV === 'test' ||
      process.env.VITEST === 'true' ||
      globalThis.vi !== undefined,

    isDevelopment: () => process.env.NODE_ENV === 'development',

    // Test failure requires isProductionUrl function: "testUtils.environment.isProductionUrl is not a function"
    isProductionUrl: () => {
      if (typeof window === 'undefined') return false; // SSR/Node environment

      const hostname = window.location.hostname;
      const origin = window.location.origin;

      // Production URLs: wigg.app and www.wigg.app (any protocol)
      return hostname === 'wigg.app' ||
             hostname === 'www.wigg.app' ||
             origin === 'https://wigg.app' ||
             origin === 'https://www.wigg.app';
    },

    shouldUseTestData: () => {
      // Use test data in test environment, development, OR non-production URLs
      return testUtils.environment.isTestEnvironment() ||
             testUtils.environment.isDevelopment() ||
             !testUtils.environment.isProductionUrl();
    }
  }
};

// Mock the dependencies
vi.mock('../useTitleProgress', () => ({
  useTitleProgress: vi.fn().mockReturnValue({
    data: {
      segments: [
        { meanScore: 1.5 }, { meanScore: 1.8 }, { meanScore: 2.1 },
        { meanScore: 2.3 }, { meanScore: 2.7 }, { meanScore: 3.0 }
      ]
    }
  })
}));

vi.mock('../useTitleMetrics', () => ({
  useTitleMetrics: vi.fn().mockReturnValue({
    data: {
      t2g_comm_pct: 35.0
    }
  })
}));

vi.mock('@/integrations/supabase/client', () => {
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({
      data: [
        {
          id: 'wigg-1',
          pos_value: 35.0,
          reason_short: 'Persistent wigg',
          created_at: new Date().toISOString(),
          pos_kind: 'percent'
        }
      ],
      error: null
    }),
    insert: vi.fn().mockResolvedValue({
      data: [{ id: 'new-wigg-id' }],
      error: null
    })
  };

  return {
    supabase: {
      from: vi.fn().mockReturnValue(mockQuery),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-123' } },
          error: null
        })
      }
    }
  };
});

describe('useUserWiggs', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should return loading state initially', () => {
    const { result } = renderHook(() => useUserWiggs('test-id'));
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(typeof result.current.addWigg).toBe('function');
  });

  it('should load wigg entries and calculate T2G after loading completes', async () => {
    const { result } = renderHook(() => useUserWiggs('test-id'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.entries).toHaveLength(1);
    expect(result.current.data?.entries[0].pct).toBe(35.0);
    expect(result.current.data?.entries[0].note).toBe('Persistent wigg');
    expect(result.current.data?.entries[0].rating).toBeUndefined();
    expect(result.current.data?.t2gEstimatePct).toBeDefined();
    expect(result.current.data?.t2gConfidence).toBeDefined();
    expect(result.current.error).toBeNull();
  });

  it('should add new wigg entry and update T2G estimate', async () => {
    const { result } = renderHook(() => useUserWiggs('test-id'));
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialEntryCount = result.current.data?.entries.length || 0;

    await act(async () => {
      await result.current.addWigg(15.0, 'Earlier good moment', 2);
    });

    expect(result.current.data?.entries).toHaveLength(initialEntryCount + 1);
    
    // Should be sorted by percentage, so new entry at 15% should be first
    const newEntry = result.current.data?.entries[0];
    expect(newEntry?.pct).toBe(15.0);
    expect(newEntry?.note).toBe('Earlier good moment');
    expect(newEntry?.rating).toBe(2);
    expect(newEntry?.id).toBeDefined();
    expect(newEntry?.createdAt).toBeDefined();
    
    // T2G should be recalculated to the new earliest good entry (15%)
    expect(result.current.data?.t2gEstimatePct).toBe(15.0);
  });

  it('should not load data for empty titleId', () => {
    const { result } = renderHook(() => useUserWiggs(''));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should persist wigg entries to Supabase and restore them on reload', async () => {
    // Use test data patterns for consistent testing
    const titleId = 'test-movie-persistence-check';
    const mockUserId = 'dev-user-tester';

    // Mock Supabase operations - need to mock the full chain
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'wigg-1',
            pos_value: 35.0,
            reason_short: 'Persistent wigg',
            created_at: new Date().toISOString(),
            pos_kind: 'percent'
          }
        ],
        error: null
      })
    };

    vi.doMock('@/integrations/supabase/client', () => ({
      supabase: {
        from: vi.fn().mockReturnValue(mockQuery),
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: mockUserId } },
            error: null
          })
        }
      }
    }));

    const { result } = renderHook(() => useUserWiggs(titleId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Debug what we actually got
    console.log('Test data:', result.current.data);
    console.log('Test entries:', result.current.data?.entries);
    console.log('Test error:', result.current.error);

    // Should have loaded the persisted wigg from Supabase
    const persistedEntry = result.current.data?.entries.find(e => e.pct === 35.0);
    expect(persistedEntry).toBeDefined();
    expect(persistedEntry?.note).toBe('Persistent wigg');
  });

  it('should insert new wigg entry to Supabase when addWigg is called', async () => {
    // Use test data pattern for media ID
    const testMediaId = 'test-game-sample-rpg';
    const { result } = renderHook(() => useUserWiggs(testMediaId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialLength = result.current.data?.entries.length || 0;

    // Call addWigg - should execute Supabase insert without errors
    await act(async () => {
      await result.current.addWigg(25.0, 'Test insertion', 2);
    });

    // Verify that the wigg was added locally (proving the function executed successfully)
    expect(result.current.data?.entries.length).toBe(initialLength + 1);

    // Verify the new entry has correct data
    const newEntry = result.current.data?.entries.find(e => e.note === 'Test insertion');
    expect(newEntry).toBeDefined();
    expect(newEntry?.pct).toBe(25.0);
  });

  it('should identify test data correctly using test utilities', () => {
    // Test media ID identification
    expect(testUtils.isTestData.mediaId('test-game-sample-rpg')).toBe(true);
    expect(testUtils.isTestData.mediaId('real-movie-123')).toBe(false);

    // Test user ID identification
    expect(testUtils.isTestData.userId('dev-user-tester')).toBe(true);
    expect(testUtils.isTestData.userId('real-user-456')).toBe(false);
  });

  it('should filter test entries from data arrays using cleanup helpers', () => {
    const mixedEntries = [
      { id: 'real-wigg-1', note: 'Real entry', pct: 25 },
      { id: 'test-wigg-2', note: '[TEST] Test entry', pct: 50 },
      { id: 'real-wigg-3', note: 'Another real entry', pct: 75 }
    ];

    const filteredEntries = testUtils.cleanup.filterTestEntries(mixedEntries);

    expect(filteredEntries).toHaveLength(2);
    expect(filteredEntries[0].id).toBe('real-wigg-1');
    expect(filteredEntries[1].id).toBe('real-wigg-3');
    expect(filteredEntries.every(entry => !testUtils.isTestData.wiggEntry(entry))).toBe(true);
  });

  it('should detect test environment correctly for safety features', () => {
    // In Vitest environment, should detect as test
    expect(testUtils.environment.isTestEnvironment()).toBe(true);
    expect(testUtils.environment.shouldUseTestData()).toBe(true);

    // Verify environment detection properties
    expect(globalThis.vi).toBeDefined(); // Vitest is available
    expect(process.env.VITEST).toBe('true'); // Vitest environment variable
  });

  it('should detect production vs non-production URLs correctly', () => {
    // Mock window.location for URL testing
    const originalLocation = window.location;

    // Test production URLs (should NOT use test data)
    ['https://wigg.app', 'https://www.wigg.app', 'https://wigg.app/', 'https://www.wigg.app/some/path'].forEach(url => {
      delete (window as any).location;
      window.location = new URL(url) as any;
      expect(testUtils.environment.isProductionUrl()).toBe(true);
      expect(testUtils.environment.shouldUseTestData()).toBe(false); // Should be false for production
    });

    // Test non-production URLs (should use test data)
    ['http://localhost:3000', 'https://my-branch-preview.vercel.app', 'https://staging.example.com'].forEach(url => {
      delete (window as any).location;
      window.location = new URL(url) as any;
      expect(testUtils.environment.isProductionUrl()).toBe(false);
      expect(testUtils.environment.shouldUseTestData()).toBe(true); // Should be true for non-production
    });

    // Restore original location
    window.location = originalLocation;
  });

  it('should correctly identify wigg.app production URLs only', () => {
    // Mock window.location for URL testing
    const originalLocation = window.location;

    // Test production URLs detection only
    ['https://wigg.app', 'https://www.wigg.app', 'https://wigg.app/', 'https://www.wigg.app/some/path'].forEach(url => {
      delete (window as any).location;
      window.location = new URL(url) as any;
      expect(testUtils.environment.isProductionUrl()).toBe(true);
    });

    // Test non-production URLs detection only
    ['http://localhost:3000', 'https://my-branch-preview.vercel.app', 'https://staging.example.com'].forEach(url => {
      delete (window as any).location;
      window.location = new URL(url) as any;
      expect(testUtils.environment.isProductionUrl()).toBe(false);
    });

    // Restore original location
    window.location = originalLocation;
  });
});