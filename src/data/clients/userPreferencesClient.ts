import { supabase } from '@/integrations/supabase/client';

export interface UserPreferences {
  id: string;
  user_id: string;
  spoiler_sensitivity: number;
  trusted_users: string[];
  created_at: string;
  updated_at: string;
}

export interface UpdateUserPreferencesInput {
  spoiler_sensitivity?: number;
  trusted_users?: string[];
}

export const userPreferencesClient = {
  getUserPreferences: async (userId: string): Promise<UserPreferences> => {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  updateUserPreferences: async (userId: string, updates: UpdateUserPreferencesInput): Promise<UserPreferences> => {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        ...updates
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};