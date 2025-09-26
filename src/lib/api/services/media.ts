import { supabase } from '@/integrations/supabase/client';
import { createApiResponse, createApiError } from '../base';

export const mediaService = {
  createMedia: async (params: any) => {
    const { data, error } = await supabase.rpc('upsert_media', {
      p_title: params.title,
      p_type: params.type,
      p_year: params.year || null
    });

    if (error) {
      return createApiError(error.message);
    }

    return createApiResponse(data);
  }
};