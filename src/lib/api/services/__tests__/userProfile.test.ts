import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userProfileService } from '../userProfile';

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn()
  }
}));

import { supabase } from '@/integrations/supabase/client';

describe('User Profile Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get user preferences successfully', async () => {
    const mockPreferences = {
      graph_type: 'curve',
      preferred_media_types: [{ type: 'game', priority: 1 }],
      hidden_media_types: ['podcast'],
      rating_ui: 'buttons'
    };

    const mockFrom = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: mockPreferences, error: null })
    };
    (supabase.from as any).mockReturnValue(mockFrom);

    const result = await userProfileService.getUserPreferences('user-123');

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockPreferences);
    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(mockFrom.select).toHaveBeenCalledWith('graph_type, preferred_media_types, hidden_media_types, rating_ui');
    expect(mockFrom.eq).toHaveBeenCalledWith('id', 'user-123');
    expect(mockFrom.maybeSingle).toHaveBeenCalled();
  });

  it('should update user preferences successfully', async () => {
    const mockFrom = {
      upsert: vi.fn().mockResolvedValue({ error: null })
    };
    (supabase.from as any).mockReturnValue(mockFrom);

    const preferences = {
      graph_type: 'scatter',
      rating_ui: 'slider'
    };

    const result = await userProfileService.updateUserPreferences('user-123', preferences);

    expect(result.success).toBe(true);
    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(mockFrom.upsert).toHaveBeenCalledWith({
      id: 'user-123',
      ...preferences
    });
  });
});