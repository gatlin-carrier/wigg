import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from 'embla-carousel-react';
import MediaTile from "@/components/media/MediaTile";
import { MediaTileSkeletonRow } from "@/components/media/MediaTileSkeleton";

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
  overview: string;
  genre_ids: number[];
}

interface MovieRecommendationsProps {
  onAddMovie: (movieData: { title: string; type: "Movie" }) => void;
}

const mockMovies: Movie[] = [
  {
    id: 1,
    title: "The Shawshank Redemption",
    poster_path: "https://images.unsplash.com/photo-1489599433202-9b75bb41c2b1?w=400&h=600&fit=crop",
    vote_average: 9.3,
    release_date: "1994-09-23",
    overview: "Two imprisoned men bond over years, finding solace and eventual redemption through acts of common decency.",
    genre_ids: [18],
  },
  {
    id: 2,
    title: "The Godfather",
    poster_path: "https://images.unsplash.com/photo-1478720568477-b0ac8ace3d4a?w=400&h=600&fit=crop",
    vote_average: 9.2,
    release_date: "1972-03-24",
    overview: "The aging patriarch of an organized crime dynasty transfers control of his empire to his reluctant son.",
    genre_ids: [18, 80],
  },
  {
    id: 3,
    title: "The Dark Knight",
    poster_path: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=400&h=600&fit=crop",
    vote_average: 9.0,
    release_date: "2008-07-18",
    overview: "Batman accepts one of the greatest psychological and physical tests to fight injustice.",
    genre_ids: [28, 18, 80],
  },
  {
    id: 4,
    title: "Pulp Fiction",
    poster_path: "https://images.unsplash.com/photo-1489599433202-9b75bb41c2b1?w=400&h=600&fit=crop",
    vote_average: 8.9,
    release_date: "1994-10-14",
    overview: "The lives of two mob hitmen, a boxer, and others intertwine in four tales of violence and redemption.",
    genre_ids: [80, 18],
  },
  {
    id: 5,
    title: "Inception",
    poster_path: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=400&h=600&fit=crop",
    vote_average: 8.8,
    release_date: "2010-07-16",
    overview: "A thief who steals corporate secrets through dream-sharing technology is given the inverse task.",
    genre_ids: [28, 878, 53],
  },
  {
    id: 6,
    title: "Fight Club",
    poster_path: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=600&fit=crop",
    vote_average: 8.8,
    release_date: "1999-10-15",
    overview: "An insomniac office worker and a devil-may-care soapmaker form an underground fight club.",
    genre_ids: [18],
  },
];

const genreMap: Record<number, string> = {
  18: 'Drama',
  80: 'Crime',
  28: 'Action',
  878: 'Sci-Fi',
  53: 'Thriller',
};

export const MovieRecommendations = ({ onAddMovie }: MovieRecommendationsProps) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    slidesToScroll: 1,
    dragFree: true,
    breakpoints: {
      '(min-width: 768px)': { slidesToScroll: 2 },
      '(min-width: 1024px)': { slidesToScroll: 3 },
    },
  });

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMovies(mockMovies);
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Popular Movies</h2>
        </div>
        <div className="overflow-hidden" ref={emblaRef}>
          <MediaTileSkeletonRow containerClassName="flex gap-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Popular Movies</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={scrollPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={scrollNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {movies.map((movie) => (
            <div key={movie.id} className="flex-none w-36 sm:w-40 md:w-44 lg:w-48">
              <MediaTile
                title={movie.title}
                imageUrl={movie.poster_path}
                year={new Date(movie.release_date).getFullYear()}
                ratingLabel={`${movie.vote_average}/10`}
                tags={movie.genre_ids.map((id) => genreMap[id]).filter(Boolean).slice(0, 2)}
                onAdd={() => onAddMovie({ title: movie.title, type: 'Movie' })}
                className="h-full"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
