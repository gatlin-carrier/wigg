import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userPreferencesClient } from '../userPreferencesClient';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'user-123',
              user_id: 'user-123',
              spoiler_sensitivity: 1,
              trusted_users: ['user-456'],
              created_at: '2024-03-01T00:00:00Z',
              updated_at: '2024-03-01T00:00:00Z'
            },
            error: null
          }))
        }))
      })),
      upsert: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: 'user-123',
                user_id: 'user-123',
                spoiler_sensitivity: 2,
                trusted_users: ['user-456', 'user-789'],
                updated_at: '2024-03-01T01:00:00Z'
              },
              error: null
            }))
          }))
        }))
      }))
    }))
  }
}));

describe('userPreferencesClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get user preferences', async () => {
    const result = await userPreferencesClient.getUserPreferences('user-123');

    expect(result.data.user_id).toBe('user-123');
    expect(result.data.spoiler_sensitivity).toBe(1);
    expect(result.data.trusted_users).toEqual(['user-456']);
  });

  it('should update user preferences', async () => {
    const result = await userPreferencesClient.updateUserPreferences('user-123', {
      spoiler_sensitivity: 2,
      trusted_users: ['user-456', 'user-789']
    });

    expect(result.success).toBe(true);
    expect(result.data.user_id).toBe('user-123');
    expect(result.data.spoiler_sensitivity).toBe(2);
    expect(result.data.trusted_users).toEqual(['user-456', 'user-789']);
  });

  it('should follow DataLayerResponse pattern for getUserPreferences', async () => {
    const result = await userPreferencesClient.getUserPreferences('user-123');

    // This test will fail until we implement DataLayerResponse pattern
    expect(result.success).toBe(true);
    expect(result.data.user_id).toBe('user-123');
    expect(result.data.spoiler_sensitivity).toBe(1);
  });

  it('should follow DataLayerResponse pattern for updateUserPreferences', async () => {
    const result = await userPreferencesClient.updateUserPreferences('user-123', {
      spoiler_sensitivity: 2
    });

    expect(result.success).toBe(true);
    expect(result.data.user_id).toBe('user-123');
    expect(result.data.spoiler_sensitivity).toBe(2);
  });
});