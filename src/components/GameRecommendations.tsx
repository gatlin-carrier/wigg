import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Game {
  id: number;
  name: string;
  cover: string | null;
  rating: number | null;
  releaseDate: number | null;
  summary: string;
  genres: string;
}

interface GameRecommendationsProps {
  onAddGame: (gameData: { title: string; type: "Game" }) => void;
}

export const GameRecommendations = ({ onAddGame }: GameRecommendationsProps) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPopularGames();
  }, []);

  const fetchPopularGames = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('fetch-popular-games');
      
      if (error) throw error;
      
      setGames(data.games || []);
    } catch (err) {
      console.error('Error fetching games:', err);
      setError('Failed to load game recommendations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Popular Games</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4 bg-gradient-card border-0 shadow-soft animate-pulse">
              <div className="aspect-video bg-muted rounded-lg mb-3"></div>
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Popular Games</h2>
        <Card className="p-6 bg-gradient-card border-0 shadow-soft text-center">
          <p className="text-muted-foreground">{error}</p>
          <Button 
            onClick={fetchPopularGames} 
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
      <h2 className="text-xl font-semibold text-foreground">Popular Games</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map((game) => (
          <Card key={game.id} className="p-4 bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-all duration-300 group">
            {game.cover && (
              <div className="aspect-video mb-3 overflow-hidden rounded-lg bg-muted">
                <img 
                  src={game.cover} 
                  alt={game.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-foreground leading-tight line-clamp-2">
                  {game.name}
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 h-8 w-8 p-0"
                  onClick={() => onAddGame({ title: game.name, type: "Game" })}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {game.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current text-yellow-500" />
                    <span>{game.rating}/100</span>
                  </div>
                )}
                {game.releaseDate && (
                  <span>{game.releaseDate}</span>
                )}
              </div>
              
              {game.genres && (
                <div className="flex flex-wrap gap-1">
                  {game.genres.split(', ').slice(0, 2).map((genre) => (
                    <Badge key={genre} variant="secondary" className="text-xs">
                      {genre}
                    </Badge>
                  ))}
                </div>
              )}
              
              {game.summary && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {game.summary}
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};