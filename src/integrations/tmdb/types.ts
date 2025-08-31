export type TmdbMovie = {
  id: number;
  title: string;
  name?: string; // for TV in multi
  release_date?: string;
  first_air_date?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  media_type?: 'movie' | 'tv' | 'person';
};

export type TmdbSearchResponse<T = TmdbMovie> = {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
};

