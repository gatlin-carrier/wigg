import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from 'embla-carousel-react';
import MediaTile from "@/components/media/MediaTile";
import { MediaTileSkeletonRow } from "@/components/media/MediaTileSkeleton";

interface TVShow {
  id: number;
  name: string;
  poster_path: string | null;
  vote_average: number;
  first_air_date: string;
  overview: string;
  genre_ids: number[];
}

interface TVShowRecommendationsProps {
  onAddTVShow: (tvData: { title: string; type: "TV Show" }) => void;
}

const mockTVShows: TVShow[] = [
  {
    id: 1,
    name: "Breaking Bad",
    poster_path: "https://images.unsplash.com/photo-1489599433202-9b75bb41c2b1?w=400&h=600&fit=crop",
    vote_average: 9.5,
    first_air_date: "2008-01-20",
    overview: "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine.",
    genre_ids: [18, 80],
  },
  {
    id: 2,
    name: "The Sopranos",
    poster_path: "https://images.unsplash.com/photo-1478720568477-b0ac8ace3d4a?w=400&h=600&fit=crop",
    vote_average: 9.2,
    first_air_date: "1999-01-10",
    overview: "New Jersey mob boss Tony Soprano deals with personal and professional issues in his home and business life.",
    genre_ids: [18, 80],
  },
  {
    id: 3,
    name: "The Wire",
    poster_path: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=600&fit=crop",
    vote_average: 9.3,
    first_air_date: "2002-06-02",
    overview: "Baltimore drug scene, seen through the eyes of drug dealers and law enforcement.",
    genre_ids: [18, 80],
  },
  {
    id: 4,
    name: "Game of Thrones",
    poster_path: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=400&h=600&fit=crop",
    vote_average: 9.0,
    first_air_date: "2011-04-17",
    overview: "Nine noble families fight for control over the mythical lands of Westeros.",
    genre_ids: [18, 14, 28],
  },
  {
    id: 5,
    name: "Stranger Things",
    poster_path: "https://images.unsplash.com/photo-1489599433202-9b75bb41c2b1?w=400&h=600&fit=crop",
    vote_average: 8.7,
    first_air_date: "2016-07-15",
    overview: "When a young boy disappears, his mother, a police chief and his friends must confront terrifying supernatural forces.",
    genre_ids: [18, 14, 27],
  },
  {
    id: 6,
    name: "The Office",
    poster_path: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=600&fit=crop",
    vote_average: 8.9,
    first_air_date: "2005-03-24",
    overview: "A mockumentary on a group of typical office workers, where the workday consists of ego clashes, inappropriate behavior, and tedium.",
    genre_ids: [35],
  },
];

const tvGenreMap: Record<number, string> = {
  18: 'Drama',
  80: 'Crime',
  14: 'Fantasy',
  28: 'Action',
  27: 'Horror',
  35: 'Comedy',
};

export const TVShowRecommendations = ({ onAddTVShow }: TVShowRecommendationsProps) => {
  const [tvShows, setTVShows] = useState<TVShow[]>([]);
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
      setTVShows(mockTVShows);
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Popular TV Shows</h2>
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
        <h2 className="text-xl font-semibold text-foreground">Popular TV Shows</h2>
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
          {tvShows.map((show) => (
            <div key={show.id} className="flex-none w-36 sm:w-40 md:w-44 lg:w-48">
              <MediaTile
                title={show.name}
                imageUrl={show.poster_path}
                year={new Date(show.first_air_date).getFullYear()}
                ratingLabel={`${show.vote_average}/10`}
                tags={show.genre_ids.map((id) => tvGenreMap[id]).filter(Boolean).slice(0, 2)}
                onAdd={() => onAddTVShow({ title: show.name, type: 'TV Show' })}
                className="h-full"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
