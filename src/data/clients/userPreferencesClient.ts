import { supabase } from '@/integrations/supabase/client';
import { handleError, handleSuccess } from '../utils/errorHandler';
import type { DataLayerResponse } from '../types/errors';

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

const withSuccessMetadata = <T extends Record<string, any>>(data: T): DataLayerResponse<T> => {
  return handleSuccess(data) as DataLayerResponse<T>;
};

export const userPreferencesClient = {
  getUserPreferences: async (userId: string): Promise<DataLayerResponse<UserPreferences>> => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        return handleError(error);
      }

      const preferences: UserPreferences = data || {
        id: '',
        user_id: userId,
        spoiler_sensitivity: 0,
        trusted_users: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return withSuccessMetadata(preferences);
    } catch (error) {
      return handleError(error);
    }
  },

  updateUserPreferences: async (userId: string, updates: UpdateUserPreferencesInput): Promise<DataLayerResponse<UserPreferences>> => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          ...updates
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return handleError(error);
      }

      return withSuccessMetadata(data);
    } catch (error) {
      return handleError(error);
    }
  }
};