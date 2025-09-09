import { useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from 'embla-carousel-react';
import { useOpenLibraryTrending } from "@/integrations/openlibrary/hooks";
import MediaTile from "@/components/media/MediaTile";
import { useNavigate } from "react-router-dom";

interface BookRecommendationsProps {
  onAddBook: (bookData: { title: string; type: "Book" }) => void;
}

export const BookRecommendations = ({ onAddBook }: BookRecommendationsProps) => {
  const { data: books = [], isFetching, isError, error } = useOpenLibraryTrending('weekly');
  const navigate = useNavigate();
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

  if (isFetching && !books.length) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Trending Books</h2>
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

  if (isError) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Trending Books</h2>
        </div>
        <Card className="p-6 bg-gradient-card border-0 shadow-soft text-center">
          <p className="text-muted-foreground">{String((error as any)?.message ?? 'Failed to load trending books')}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Trending Books</h2>
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
          {books.map((book: any) => (
            <div key={book.id} className="flex-none w-36 sm:w-40 md:w-44 lg:w-48">
              <MediaTile
                title={book.title}
                imageUrl={book.cover_url}
                year={book.year}
                tags={book.genre ? [book.genre] : []}
                onAdd={() => onAddBook({ title: book.title, type: 'Book' })}
                onClick={() => navigate(`/media/openlibrary/${encodeURIComponent(book.id)}`)}
                mediaData={{
                  source: 'openlibrary',
                  id: String(book.id),
                  title: book.title,
                  type: 'book',
                  posterUrl: book.cover_url,
                  year: book.year
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
