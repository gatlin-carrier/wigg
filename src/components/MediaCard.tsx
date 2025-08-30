import { Card } from "@/components/ui/card";

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

interface MediaCardProps {
  entry: MediaEntry;
}

export const MediaCard = ({ entry }: MediaCardProps) => {
  const formatTime = (hours: number, minutes: number) => {
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      "TV Show": "bg-purple-100 text-purple-700",
      "Movie": "bg-blue-100 text-blue-700",
      "Book": "bg-green-100 text-green-700",
      "Podcast": "bg-orange-100 text-orange-700",
      "Game": "bg-red-100 text-red-700",
      "Other": "bg-gray-100 text-gray-700"
    };
    return colors[type as keyof typeof colors] || colors.Other;
  };

  return (
    <Card className="p-6 bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-foreground mb-2 leading-tight">
            {entry.title}
          </h3>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(entry.type)}`}>
            {entry.type}
          </span>
        </div>
        <div className="ml-4 text-right">
          <div className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            {formatTime(entry.timeToGetGood.hours, entry.timeToGetGood.minutes)}
          </div>
          <div className="text-xs text-muted-foreground">to get good</div>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <span className="text-sm text-muted-foreground">by {entry.author}</span>
        <span className="text-xs text-muted-foreground">{entry.timestamp}</span>
      </div>
    </Card>
  );
};