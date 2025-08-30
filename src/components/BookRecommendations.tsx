import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from 'embla-carousel-react';

interface Book {
  id: number;
  title: string;
  cover_url: string | null;
  rating: number;
  publication_year: number;
  description: string;
  author: string;
  genre: string;
}

interface BookRecommendationsProps {
  onAddBook: (bookData: { title: string; type: "Book" }) => void;
}

// Mock popular books data
const mockBooks: Book[] = [
  {
    id: 1,
    title: "The Great Gatsby",
    cover_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop",
    rating: 8.2,
    publication_year: 1925,
    description: "A classic tale of decadence and excess in Jazz Age America, following the mysterious Jay Gatsby.",
    author: "F. Scott Fitzgerald",
    genre: "Fiction"
  },
  {
    id: 2,
    title: "To Kill a Mockingbird",
    cover_url: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop",
    rating: 8.5,
    publication_year: 1960,
    description: "A gripping tale of racial injustice and childhood innocence in the American South.",
    author: "Harper Lee",
    genre: "Fiction"
  },
  {
    id: 3,
    title: "1984",
    cover_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop",
    rating: 8.8,
    publication_year: 1949,
    description: "A dystopian social science fiction novel about totalitarian control and surveillance.",
    author: "George Orwell",
    genre: "Dystopian"
  },
  {
    id: 4,
    title: "Pride and Prejudice",
    cover_url: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop",
    rating: 8.3,
    publication_year: 1813,
    description: "A romantic novel about manners, upbringing, morality, and marriage in Regency England.",
    author: "Jane Austen",
    genre: "Romance"
  },
  {
    id: 5,
    title: "The Catcher in the Rye",
    cover_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop",
    rating: 7.9,
    publication_year: 1951,
    description: "A controversial novel about teenage rebellion and alienation in post-war America.",
    author: "J.D. Salinger",
    genre: "Fiction"
  },
  {
    id: 6,
    title: "Dune",
    cover_url: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop",
    rating: 8.7,
    publication_year: 1965,
    description: "An epic science fiction novel set in a distant future amidst a feudal interstellar society.",
    author: "Frank Herbert",
    genre: "Sci-Fi"
  }
];

export const BookRecommendations = ({ onAddBook }: BookRecommendationsProps) => {
  const [books, setBooks] = useState<Book[]>([]);
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
      setBooks(mockBooks);
      setLoading(false);
    }, 800);
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Popular Books</h2>
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
        <h2 className="text-xl font-semibold text-foreground">Popular Books</h2>
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
          {books.map((book) => (
            <div key={book.id} className="flex-none w-80">
              <Card className="p-4 bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-all duration-300 group h-full">
                {book.cover_url && (
                  <div className="aspect-[2/3] mb-3 overflow-hidden rounded-lg bg-muted">
                    <img 
                      src={book.cover_url} 
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-foreground leading-tight line-clamp-2">
                      {book.title}
                    </h3>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 h-8 w-8 p-0"
                      onClick={() => onAddBook({ title: book.title, type: "Book" })}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current text-yellow-500" />
                      <span>{book.rating}/10</span>
                    </div>
                    <span>{book.publication_year}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {book.genre}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-1">
                    by {book.author}
                  </p>
                  
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {book.description}
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