import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MediaCard } from "@/components/MediaCard";
import { AddMediaForm } from "@/components/AddMediaForm";
import { Clock, TrendingUp, Users } from "lucide-react";

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

const Index = () => {
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

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              When does it get good?
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
              Track and share how long it takes for movies, shows, books, and more to become worth your time.
            </p>
            <Button variant="hero" size="lg" className="text-lg px-8 py-4 h-auto">
              Start Tracking Media
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-12 border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-gradient-primary bg-clip-text text-transparent">
                <Clock className="h-8 w-8 mx-auto mb-3 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-1">Save Time</h3>
              <p className="text-muted-foreground">Know before you commit hours to new media</p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-primary bg-clip-text text-transparent">
                <TrendingUp className="h-8 w-8 mx-auto mb-3 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-1">Find Quality</h3>
              <p className="text-muted-foreground">Discover which shows are worth the investment</p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-primary bg-clip-text text-transparent">
                <Users className="h-8 w-8 mx-auto mb-3 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-1">Share Insights</h3>
              <p className="text-muted-foreground">Help others with your viewing experience</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Add Form */}
          <div className="mb-12 flex justify-center">
            <AddMediaForm onSubmit={handleAddEntry} />
          </div>

          {/* Entries Feed */}
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

export default Index;