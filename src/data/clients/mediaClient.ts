import { searchMovies as tmdbSearchMovies, searchMulti as tmdbSearchMulti, getMovieDetails as tmdbGetMovieDetails, getTvDetails as tmdbGetTvDetails, getTrendingMovies as tmdbGetTrendingMovies } from '@/integrations/tmdb/client';
import { supabase } from '@/integrations/supabase/client';
import { handleError, handleSuccess } from '../utils/errorHandler';
import type { DataLayerResponse } from '../types/errors';

interface CreateMediaParams {
  title: string;
  type: string;
  year?: number;
}

export const mediaClient = {
  searchMovies: async (query: string, page = 1) => {
    return await tmdbSearchMovies(query, page);
  },

  searchMulti: async (query: string, page = 1) => {
    return await tmdbSearchMulti(query, page);
  },

  getMovieDetails: async (id: number) => {
    return await tmdbGetMovieDetails(id);
  },

  getTvDetails: async (id: number) => {
    return await tmdbGetTvDetails(id);
  },

  getTrendingMovies: async (period: 'day' | 'week' = 'day', page = 1) => {
    return await tmdbGetTrendingMovies(period, page);
  },

  createMedia: async (params: CreateMediaParams): Promise<DataLayerResponse<any>> => {
    try {
      const { data, error } = await supabase.rpc('upsert_media', {
        p_title: params.title,
        p_type: params.type,
        p_year: params.year || null
      });

      if (error) return handleError(error);
      return handleSuccess(data);
    } catch (error) {
      return handleError(error);
    }
  },

  getMediaById: async (id: string): Promise<DataLayerResponse<any>> => {
    try {
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('id', id)
        .single();

      if (error) return handleError(error);
      return handleSuccess(data);
    } catch (error) {
      return handleError(error);
    }
  },

  updateMedia: async (id: string, updateData: Partial<CreateMediaParams>): Promise<DataLayerResponse<any>> => {
    try {
      const { data, error } = await supabase
        .from('media')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) return handleError(error);
      return handleSuccess(data);
    } catch (error) {
      return handleError(error);
    }
  },

  deleteMedia: async (id: string): Promise<DataLayerResponse<any>> => {
    try {
      const { data, error } = await supabase
        .from('media')
        .delete()
        .eq('id', id);

      if (error) return handleError(error);
      return handleSuccess(data);
    } catch (error) {
      return handleError(error);
    }
  }
};