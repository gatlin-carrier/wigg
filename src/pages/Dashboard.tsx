import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MediaCard } from "@/components/MediaCard";
import { AddMediaForm } from "@/components/AddMediaForm";
import { GameRecommendations } from "@/components/GameRecommendations";
import { MovieRecommendations } from "@/components/MovieRecommendations";
import { TVShowRecommendations } from "@/components/TVShowRecommendations";
import { BookRecommendations } from "@/components/BookRecommendations";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  const [entries, setEntries] = useState<MediaEntry[]>(mockEntries);

  const handleAddEntry = (formData: any) => {
    const newEntry: MediaEntry = {
      id: Date.now().toString(),
      title: formData.title,
      type: formData.type,
      timeToGetGood: {
        hours: formData.hours,
        minutes: formData.minutes
      },
      author: formData.author,
      timestamp: "Just now"
    };
    setEntries([newEntry, ...entries]);
  };

  const handleAddFromRecommendation = (mediaData: { title: string; type: "Game" | "Movie" | "TV Show" | "Book" }) => {
    const newEntry: MediaEntry = {
      id: Date.now().toString(),
      title: mediaData.title,
      type: mediaData.type,
      timeToGetGood: {
        hours: 0,
        minutes: 0
      },
      author: "You",
      timestamp: "Just now"
    };
    setEntries([newEntry, ...entries]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 py-6">
        <div className="container mx-auto px-4">
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
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Add Form */}
          <div className="flex justify-center">
            <AddMediaForm onSubmit={handleAddEntry} />
          </div>

          {/* Recommendations Sections */}
          <GameRecommendations onAddGame={handleAddFromRecommendation} />
          <MovieRecommendations onAddMovie={handleAddFromRecommendation} />
          <TVShowRecommendations onAddTVShow={handleAddFromRecommendation} />
          <BookRecommendations onAddBook={handleAddFromRecommendation} />

          {/* Recent Entries */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Recent Entries</h2>
              <p className="text-muted-foreground">See what the community is saying</p>
            </div>
            
            <div className="grid gap-6">
              {entries.map((entry) => (
                <MediaCard key={entry.id} entry={entry} />
              ))}
            </div>
          </div>
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