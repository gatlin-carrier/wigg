import { supabase } from '@/integrations/supabase/client';
import { handleError, handleSuccess } from '../utils/errorHandler';
import type { DataLayerResponse } from '../types/errors';

export const socialClient = {
  getLikeCount: async (pointId: string): Promise<DataLayerResponse<number>> => {
    try {
      const { data, error } = await supabase.rpc('get_wigg_point_like_count', { point_id: pointId });

      if (error) return handleError(error);
      return handleSuccess(data);
    } catch (error) {
      return handleError(error);
    }
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
  },

  isFollowing: async (followerId: string, followingId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('user_follows')
      .select('*')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data !== null;
  },

  followUser: async (followerId: string, followingId: string): Promise<void> => {
    const { error } = await supabase
      .from('user_follows')
      .insert({
        follower_id: followerId,
        following_id: followingId
      });

    if (error) throw error;
  },

  unfollowUser: async (followerId: string, followingId: string): Promise<void> => {
    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) throw error;
  },

  addComment: async (params: { pointId: string; userId: string; content: string }): Promise<DataLayerResponse<null>> => {
    try {
      const { error } = await supabase
        .from('wigg_point_comments')
        .insert({
          point_id: params.pointId,
          user_id: params.userId,
          content: params.content
        });

      if (error) return handleError(error);
      return handleSuccess(null);
    } catch (error) {
      return handleError(error);
    }
  },

  deleteComment: async (params: { commentId: string; userId: string }): Promise<DataLayerResponse<null>> => {
    try {
      const { error } = await supabase
        .from('wigg_point_comments')
        .delete()
        .eq('id', params.commentId)
        .eq('user_id', params.userId);

      if (error) return handleError(error);
      return handleSuccess(null);
    } catch (error) {
      return handleError(error);
    }
  }
};