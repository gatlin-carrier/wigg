import { supabase } from '@/integrations/supabase/client';
import type { WiggPoint, CreateWiggPointInput } from '../types';

export const wiggPointsClient = {
  getUserWiggPoints: async (userId: string, mediaId: string): Promise<WiggPoint[]> => {
    const { data, error } = await supabase
      .from('wigg_points')
      .select('*')
      .eq('user_id', userId)
      .eq('media_id', mediaId)
      .order('pos_value', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  createWiggPoint: async (wiggData: CreateWiggPointInput): Promise<WiggPoint> => {
    const { data, error } = await supabase
      .from('wigg_points')
      .insert(wiggData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};