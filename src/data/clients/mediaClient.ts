import { searchMovies as tmdbSearchMovies, searchMulti as tmdbSearchMulti, getMovieDetails as tmdbGetMovieDetails } from '@/integrations/tmdb/client';

export const mediaClient = {
  searchMovies: async (query: string, page = 1) => {
    return await tmdbSearchMovies(query, page);
  },

  searchMulti: async (query: string, page = 1) => {
    return await tmdbSearchMulti(query, page);
  },

  getMovieDetails: async (id: number) => {
    return await tmdbGetMovieDetails(id);
  }
};