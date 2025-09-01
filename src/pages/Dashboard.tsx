import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WiggPointForm } from "@/components/WiggPointForm";
import { WiggPointsList } from "@/components/WiggPointsList";
import { GameRecommendations } from "@/components/GameRecommendations";
import { BookRecommendations } from "@/components/BookRecommendations";
import { Plus, List } from "lucide-react";
import Feed from "./Feed";
import TmdbPopular from "@/components/tmdb/TmdbPopular";
import TmdbPopularTv from "@/components/tmdb/TmdbPopularTv";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { usePageHeader } from "@/contexts/HeaderContext";

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
  const { user } = useAuth();
  const [userPreferences, setUserPreferences] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      loadUserPreferences();
    }
  }, [user]);

  const loadUserPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('preferred_media_types')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data?.preferred_media_types) {
        setUserPreferences(data.preferred_media_types);
      } else {
        // Default preferences if none set
        setUserPreferences(["Movie", "TV Show", "Game", "Book", "Podcast"]);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
      // Default preferences on error
      setUserPreferences(["Movie", "TV Show", "Game", "Book", "Podcast"]);
    }
  };
  const [selectedMedia, setSelectedMedia] = useState<{ title: string; type: "Game" | "Movie" | "TV Show" | "Book" } | null>(null);
  
  // Configure global header for this page
  usePageHeader({
    title: "WIGG Dashboard",
    subtitle: "Discover when media gets good and track your own entries",
    showBackButton: true,
    showHomeButton: true,
  });

  const handleAddFromRecommendation = (mediaData: { title: string; type: "Game" | "Movie" | "TV Show" | "Book" }) => {
    setSelectedMedia(mediaData);
  };

  const handleWiggPointSuccess = () => {
    setSelectedMedia(null);
  };

  const [tab, setTab] = useState<'feed'|'browse'|'add'>('browse');

  return (
    <>
      <div className="container mx-auto px-4 py-6 space-y-8">
        <div className="max-w-6xl mx-auto">
          <Tabs value={tab} onValueChange={(v:any)=>setTab(v)} className="space-y-8">
            <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
              <TabsTrigger value="feed">Feed</TabsTrigger>
              <TabsTrigger value="browse" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Browse
              </TabsTrigger>
              <TabsTrigger value="add" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add WIGG
              </TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="space-y-12">
              {/* Discover rails */}
              <div className="space-y-4">
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
                  <BookRecommendations onAddBook={handleAddFromRecommendation} />
                </div>
              </div>

              {/* Community list */}
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold">Community WIGG Points</h2>
                  <p className="text-muted-foreground">
                    See when media gets good according to the community
                  </p>
                </div>
                <WiggPointsList />
              </div>
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

            {/* Removed separate Discover tab; content merged into Browse */}

            <TabsContent value="feed" className="space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">Community Feed</h2>
                <p className="text-muted-foreground">Recent WIGG points from other users (prototype)</p>
              </div>
              <Feed />
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
    </>
  );
};

export default Dashboard;
