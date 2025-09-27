import { supabase } from '@/integrations/supabase/client';

export const socialClient = {
  getLikeCount: async (pointId: string): Promise<number> => {
    const { data, error } = await supabase.rpc('get_wigg_point_like_count', { point_id: pointId });

    if (error) throw error;
    return data;
  },

  hasUserLiked: async (pointId: string, userId: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc('user_liked_wigg_point', { point_id: pointId, user_id: userId });

    if (error) throw error;
    return data;
  },

  toggleLike: async (params: { pointId: string; userId: string; isLiked: boolean }): Promise<void> => {
    if (!params.isLiked) {
      const { error } = await supabase
        .from('wigg_point_likes')
        .insert({
          point_id: params.pointId,
          user_id: params.userId
        });

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('wigg_point_likes')
        .delete()
        .eq('point_id', params.pointId)
        .eq('user_id', params.userId);

      if (error) throw error;
    }
  },

  getComments: async (pointId: string) => {
    const { data, error } = await supabase
      .from('wigg_point_comments')
      .select('id, user_id, point_id, content, created_at, updated_at, profiles(username)')
      .eq('point_id', pointId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const comments = (data as any[]).map(row => ({
      id: row.id,
      userId: row.user_id,
      username: row.profiles?.username ?? 'Anonymous',
      content: row.content,
      createdAt: row.created_at
    }));

    return comments;
  }
};