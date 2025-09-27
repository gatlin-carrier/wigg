import { supabase } from '@/integrations/supabase/client';
import { createApiResponse, createApiError } from '../base';

interface CreateMediaParams {
  title: string;
  type: string;
  year?: number;
}

export const mediaService = {
  createMedia: async (params: CreateMediaParams) => {
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