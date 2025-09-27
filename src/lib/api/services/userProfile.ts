import { supabase } from '@/integrations/supabase/client';
import { createApiResponse, createApiError } from '../base';

export const userProfileService = {
  getUserPreferences: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('graph_type, preferred_media_types, hidden_media_types, rating_ui')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return createApiError(error.message);
    }

    return createApiResponse(data);
  },

  updateUserPreferences: async (userId: string, preferences: Record<string, any>) => {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        ...preferences
      });

    if (error) {
      return createApiError(error.message);
    }

    return createApiResponse(null);
  }
};