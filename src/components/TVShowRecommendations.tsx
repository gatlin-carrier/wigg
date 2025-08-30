import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from 'embla-carousel-react';

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

// Mock popular TV shows data
const mockTVShows: TVShow[] = [
  {
    id: 1,
    name: "Breaking Bad",
    poster_path: "https://images.unsplash.com/photo-1489599433202-9b75bb41c2b1?w=400&h=600&fit=crop",
    vote_average: 9.5,
    first_air_date: "2008-01-20",
    overview: "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine.",
    genre_ids: [18, 80]
  },
  {
    id: 2,
    name: "The Sopranos",
    poster_path: "https://images.unsplash.com/photo-1478720568477-b0ac8ace3d4a?w=400&h=600&fit=crop",
    vote_average: 9.2,
    first_air_date: "1999-01-10",
    overview: "New Jersey mob boss Tony Soprano deals with personal and professional issues in his home and business life.",
    genre_ids: [18, 80]
  },
  {
    id: 3,
    name: "The Wire",
    poster_path: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=600&fit=crop",
    vote_average: 9.3,
    first_air_date: "2002-06-02",
    overview: "Baltimore drug scene, seen through the eyes of drug dealers and law enforcement.",
    genre_ids: [18, 80]
  },
  {
    id: 4,
    name: "Game of Thrones",
    poster_path: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=400&h=600&fit=crop",
    vote_average: 9.0,
    first_air_date: "2011-04-17",
    overview: "Nine noble families fight for control over the mythical lands of Westeros.",
    genre_ids: [18, 14, 28]
  },
  {
    id: 5,
    name: "Stranger Things",
    poster_path: "https://images.unsplash.com/photo-1489599433202-9b75bb41c2b1?w=400&h=600&fit=crop",
    vote_average: 8.7,
    first_air_date: "2016-07-15",
    overview: "When a young boy disappears, his mother, a police chief and his friends must confront terrifying supernatural forces.",
    genre_ids: [18, 14, 27]
  },
  {
    id: 6,
    name: "The Office",
    poster_path: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=600&fit=crop",
    vote_average: 8.9,
    first_air_date: "2005-03-24",
    overview: "A mockumentary on a group of typical office workers, where the workday consists of ego clashes, inappropriate behavior, and tedium.",
    genre_ids: [35]
  }
];

export const TVShowRecommendations = ({ onAddTVShow }: TVShowRecommendationsProps) => {
  const [tvShows, setTVShows] = useState<TVShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false, 
    align: 'start',
    slidesToScroll: 1,
    breakpoints: {
      '(min-width: 768px)': { slidesToScroll: 2 },
      '(min-width: 1024px)': { slidesToScroll: 3 }
    }
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setTVShows(mockTVShows);
      setLoading(false);
    }, 1200);
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Popular TV Shows</h2>
        </div>
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-none w-80">
                <Card className="p-4 bg-gradient-card border-0 shadow-soft animate-pulse">
                  <div className="aspect-[2/3] bg-muted rounded-lg mb-3"></div>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Popular TV Shows</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={scrollPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={scrollNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {tvShows.map((show) => (
            <div key={show.id} className="flex-none w-80">
              <Card className="p-4 bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-all duration-300 group h-full">
                {show.poster_path && (
                  <div className="aspect-[2/3] mb-3 overflow-hidden rounded-lg bg-muted">
                    <img 
                      src={show.poster_path} 
                      alt={show.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-foreground leading-tight line-clamp-2">
                      {show.name}
                    </h3>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 h-8 w-8 p-0"
                      onClick={() => onAddTVShow({ title: show.name, type: "TV Show" })}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current text-yellow-500" />
                      <span>{show.vote_average}/10</span>
                    </div>
                    <span>{new Date(show.first_air_date).getFullYear()}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">
                      Drama
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {show.overview}
                  </p>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};