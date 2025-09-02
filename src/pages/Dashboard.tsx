import React, { useState, useEffect } from "react";
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
import AnilistAnime from "@/components/anilist/AnilistAnime";
import AnilistManga from "@/components/anilist/AnilistManga";
import AnilistWebtoons from "@/components/anilist/AnilistWebtoons";
import PodcastTrending from "@/components/podcast/PodcastTrending";
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
  const [hiddenTypes, setHiddenTypes] = useState<string[]>([]);

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
        .select('preferred_media_types, hidden_media_types')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data?.preferred_media_types) {
        // Handle JSONB format from database - extract just the types for ordering
        const preferences = Array.isArray(data.preferred_media_types) 
          ? (data.preferred_media_types as Array<{type: string, priority: number}>)
              .sort((a, b) => a.priority - b.priority)
              .map(p => p.type)
          : [];
        setUserPreferences(preferences.length > 0 ? preferences : ["Movie", "TV Show", "Anime", "Manga", "Webtoons", "Game", "Book", "Podcast"]);
        setHiddenTypes(Array.isArray((data as any).hidden_media_types) ? (data as any).hidden_media_types as string[] : []);
      } else {
        // Default preferences if none set
        setUserPreferences(["Movie", "TV Show", "Anime", "Manga", "Webtoons", "Game", "Book", "Podcast"]);
        setHiddenTypes([]);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
      // Default preferences on error
      setUserPreferences(["Movie", "TV Show", "Anime", "Manga", "Webtoons", "Game", "Book", "Podcast"]);
      setHiddenTypes([]);
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
                  {/* Render sections based on user preferences priority */}
                  {userPreferences.map((mediaType) => {
                    if (hiddenTypes.includes(mediaType)) return null;
                    switch (mediaType) {
                      case "Movie":
                        return <TmdbPopular key="movies" kind="trending" period="day" onAdd={(it) => handleAddFromRecommendation({ title: it.title, type: 'Movie' })} />;
                      case "TV Show":
                        return <TmdbPopularTv key="tv" kind="popular" onAdd={(it) => handleAddFromRecommendation({ title: it.title, type: 'TV Show' })} />;
                      case "Anime":
                        return <AnilistAnime key="anime" onAdd={(it) => handleAddFromRecommendation({ title: it.title, type: it.type })} />;
                      case "Manga":
                        return <AnilistManga key="manga" onAdd={(it) => handleAddFromRecommendation({ title: it.title, type: 'Book' })} />;
                      case "Game":
                        return <GameRecommendations key="games" onAddGame={handleAddFromRecommendation} />;
                      case "Book":
                        return <BookRecommendations key="books" onAddBook={handleAddFromRecommendation} />;
                      case "Podcast":
                        return <PodcastTrending key="podcasts" onAdd={(it) => handleAddFromRecommendation({ title: it.title, type: 'Podcast' })} />;
                      case "Webtoons":
                        return <AnilistWebtoons key="webtoons" onAdd={(it) => handleAddFromRecommendation({ title: it.title, type: 'Book' })} />;
                      default:
                        return null;
                    }
                  })}
                  
                  {/* Show any missing sections that weren't in user preferences */}
                  {!userPreferences.includes("Movie") && !hiddenTypes.includes("Movie") && (
                    <TmdbPopular kind="trending" period="day" onAdd={(it) => handleAddFromRecommendation({ title: it.title, type: 'Movie' })} />
                  )}
                  {!userPreferences.includes("TV Show") && !hiddenTypes.includes("TV Show") && (
                    <TmdbPopularTv kind="popular" onAdd={(it) => handleAddFromRecommendation({ title: it.title, type: 'TV Show' })} />
                  )}
                  {!userPreferences.includes("Anime") && !hiddenTypes.includes("Anime") && (
                    <AnilistAnime onAdd={(it) => handleAddFromRecommendation({ title: it.title, type: it.type })} />
                  )}
                  {!userPreferences.includes("Manga") && !hiddenTypes.includes("Manga") && (
                    <AnilistManga onAdd={(it) => handleAddFromRecommendation({ title: it.title, type: 'Book' })} />
                  )}
                  {!userPreferences.includes("Webtoons") && !hiddenTypes.includes("Webtoons") && (
                    <AnilistWebtoons onAdd={(it) => handleAddFromRecommendation({ title: it.title, type: 'Book' })} />
                  )}
                  {!userPreferences.includes("Game") && !hiddenTypes.includes("Game") && (
                    <GameRecommendations onAddGame={handleAddFromRecommendation} />
                  )}
                  {!userPreferences.includes("Podcast") && !hiddenTypes.includes("Podcast") && (
                    <PodcastTrending onAdd={(it) => handleAddFromRecommendation({ title: it.title, type: 'Podcast' })} />
                  )}
                  {!userPreferences.includes("Book") && !hiddenTypes.includes("Book") && (
                    <BookRecommendations onAddBook={handleAddFromRecommendation} />
                  )}
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
