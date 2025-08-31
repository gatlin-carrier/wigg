import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WiggPointForm } from "@/components/WiggPointForm";
import { WiggPointsList } from "@/components/WiggPointsList";
import { GameRecommendations } from "@/components/GameRecommendations";
// Removed placeholder popular movies in favor of TMDB feed
// import { MovieRecommendations } from "@/components/MovieRecommendations";
// import { TVShowRecommendations } from "@/components/TVShowRecommendations";
import { BookRecommendations } from "@/components/BookRecommendations";
import { ArrowLeft, Plus, List } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import TmdbPopular from "@/components/tmdb/TmdbPopular";
import TmdbPopularTv from "@/components/tmdb/TmdbPopularTv";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface MediaEntry {
  id: string;
  title: string;
  type: "TV Show" | "Movie" | "Book" | "Podcast" | "Game" | "Other";
  timeToGetGood: {
    hours: number;
    minutes: number;
  };
  author: string;
  timestamp: string;
}

const mockEntries: MediaEntry[] = [
  {
    id: "1",
    title: "The Wire",
    type: "TV Show",
    timeToGetGood: { hours: 4, minutes: 30 },
    author: "Sarah",
    timestamp: "2 hours ago"
  },
  {
    id: "2", 
    title: "Dune",
    type: "Book",
    timeToGetGood: { hours: 2, minutes: 0 },
    author: "Mike",
    timestamp: "1 day ago"
  },
  {
    id: "3",
    title: "The Sopranos",
    type: "TV Show", 
    timeToGetGood: { hours: 1, minutes: 45 },
    author: "Emma",
    timestamp: "3 days ago"
  }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedMedia, setSelectedMedia] = useState<{ title: string; type: "Game" | "Movie" | "TV Show" | "Book" } | null>(null);

  const handleAddFromRecommendation = (mediaData: { title: string; type: "Game" | "Movie" | "TV Show" | "Book" }) => {
    setSelectedMedia(mediaData);
  };

  const handleWiggPointSuccess = () => {
    setSelectedMedia(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  WIGG Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Discover when media gets good and track your own entries
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="browse" className="space-y-8">
            <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
              <TabsTrigger value="browse" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Browse
              </TabsTrigger>
              <TabsTrigger value="add" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add WIGG
              </TabsTrigger>
              <TabsTrigger value="discover">Discover</TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">Community WIGG Points</h2>
                <p className="text-muted-foreground">
                  See when media gets good according to the community
                </p>
              </div>
              <WiggPointsList />
            </TabsContent>

            <TabsContent value="add" className="space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">Add a WIGG Point</h2>
                <p className="text-muted-foreground">
                  Help others discover when media gets good
                </p>
              </div>
              <WiggPointForm 
                initialData={selectedMedia}
                onSuccess={handleWiggPointSuccess}
              />
            </TabsContent>

            <TabsContent value="discover" className="space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">Discover New Media</h2>
                <p className="text-muted-foreground">
                  Find your next favorite show, game, book, or movie
                </p>
              </div>
              
              <div className="space-y-12">
                <TmdbPopular kind="trending" period="day" onAdd={(it) => handleAddFromRecommendation({ title: it.title, type: 'Movie' })} />
                <TmdbPopularTv kind="popular" onAdd={(it) => handleAddFromRecommendation({ title: it.title, type: 'TV Show' })} />
                <GameRecommendations onAddGame={handleAddFromRecommendation} />
                {/* Placeholder removed: Popular TV Shows carousel */}
                <BookRecommendations onAddBook={handleAddFromRecommendation} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            WIGG
          </h3>
          <p className="text-muted-foreground text-sm">
            When It Gets Good - Track media worth your time
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
