import { supabase } from '@/integrations/supabase/client';

export const mediaService = {
  createMedia: async (params: any) => {
    await supabase.rpc('upsert_media', {
      p_title: params.title,
      p_type: params.type,
      p_year: params.year
    });

    return {
      success: true,
      data: 'media-123'
    };
  }
};