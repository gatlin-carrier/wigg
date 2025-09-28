import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSupabase = {
  rpc: vi.fn(),
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

describe('populate-metrics script', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock environment variables
    process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_key';
  });

  it('should populate user_first_good table from existing wigg_points', async () => {
    // Mock successful population
    mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });
    mockSupabase.select.mockResolvedValueOnce({ count: 42, error: null });

    const { populateMetrics } = await import('../populate-metrics');

    await expect(populateMetrics()).resolves.not.toThrow();

    // Should execute SQL to populate user_first_good table
    expect(mockSupabase.rpc).toHaveBeenCalledWith('exec_sql', {
      sql: expect.stringContaining('INSERT INTO public.user_first_good')
    });
  });
});