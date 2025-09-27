import { supabase } from '@/integrations/supabase/client';

export const wiggPersistenceClient = {
  saveRating: async (input: any) => {
    const { data, error } = await supabase
      .from('wigg_ratings')
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  saveMoment: async (input: any) => {
    const { data, error } = await supabase
      .from('wigg_moments')
      .upsert(input)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};