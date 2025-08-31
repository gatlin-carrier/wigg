import { useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePopularGames } from "@/integrations/games/hooks";
import useEmblaCarousel from 'embla-carousel-react';
import MediaTile from "@/components/media/MediaTile";

interface GameRecommendationsProps {
  onAddGame: (gameData: { title: string; type: "Game" }) => void;
}

export const GameRecommendations = ({ onAddGame }: GameRecommendationsProps) => {
  const { data: games = [], isFetching, isError, error, refetch } = usePopularGames();
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false, 
    align: 'start',
    slidesToScroll: 1,
    dragFree: true,
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

  if (isFetching && !games.length) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Popular Games</h2>
        </div>
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-none w-80">
                <Card className="p-4 bg-gradient-card border-0 shadow-soft animate-pulse">
                  <div className="aspect-video bg-muted rounded-lg mb-3"></div>
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

  if (isError) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Popular Games</h2>
        </div>
        <Card className="p-6 bg-gradient-card border-0 shadow-soft text-center">
          <p className="text-muted-foreground">{String((error as any)?.message ?? 'Failed to load game recommendations')}</p>
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            className="mt-3"
          >
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Popular Games</h2>
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
          {games.map((game: any) => (
            <div key={game.id} className="flex-none w-36 sm:w-40 md:w-44 lg:w-48">
              <MediaTile
                title={game.name}
                imageUrl={game.cover}
                year={game.releaseDate}
                ratingLabel={game.rating ? `${game.rating}/100` : undefined}
                tags={game.genres ? String(game.genres).split(', ').slice(0, 2) : []}
                onAdd={() => onAddGame({ title: game.name, type: 'Game' })}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
