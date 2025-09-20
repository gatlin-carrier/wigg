import { useState, useEffect } from "react";
import { WiggPointCard } from "./WiggPointCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface WiggPoint {
  id: string;
  media_title: string;
  type: string;
  pos_kind: string;
  pos_value: number;
  reason_short?: string;
  tags: string[];
  spoiler: string;
  created_at: string;
  username?: string;
  user_id: string;
}

interface WiggPointsListProps {
  limit?: number;
  showFilters?: boolean;
  userId?: string; // If provided, only show points from this user
}

export const WiggPointsList = ({ 
  limit = 20, 
  showFilters = true, 
  userId 
}: WiggPointsListProps) => {
  const { user } = useAuth();
  const [points, setPoints] = useState<WiggPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [mediaTypeFilter, setMediaTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  const fetchWiggPoints = async () => {
    setLoading(true);
    
    try {
      // Use the media_lookup view for better performance
      let query = supabase
        .from('wigg_points')
        .select(`
          id,
          pos_kind,
          pos_value,
          reason_short,
          tags,
          spoiler,
          created_at,
          user_id,
          media:media!inner(title, type),
          profiles:profiles(username)
        `);

      // Remove user vote filtering for now to fix the database error

      // Apply filters
      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (mediaTypeFilter !== "all") {
        query = query.eq('media.type', mediaTypeFilter as any);
      }

      if (searchTerm) {
        query = query.ilike('media.title', `%${searchTerm}%`);
      }

      // Apply sorting
      switch (sortBy) {
        case "newest":
          query = query.order('created_at', { ascending: false });
          break;
        case "oldest":
          query = query.order('created_at', { ascending: true });
          break;        case "position_asc":
          query = query.order('pos_value', { ascending: true });
          break;
        case "position_desc":
          query = query.order('pos_value', { ascending: false });
          break;
      }

      query = query.limit(limit);

      const { data, error } = await query;

      if (error) throw error;

      // Transform the data
      let transformedPoints: WiggPoint[] = (data || []).map((point: any) => ({
        id: point.id,
        media_title: point.media?.title || "Unknown",
        type: point.media?.type || "Unknown",
        pos_kind: point.pos_kind,
        pos_value: point.pos_value,
        reason_short: point.reason_short,
        tags: point.tags || [],
        spoiler: point.spoiler,
        created_at: point.created_at,
        username: point.profiles?.username,
        user_id: point.user_id,
      }));
      setPoints(transformedPoints);

    } catch (error) {
      console.error('Error fetching WIGG points:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWiggPoints();
  }, [searchTerm, mediaTypeFilter, sortBy, userId, user?.id]);


  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => {
          const baseDelay = index * 0.12;
          const secondaryDelay = baseDelay + 0.05;
          const tertiaryDelay = baseDelay + 0.12;
          return (
            <Card key={index} className="w-full border border-border/60 bg-card/70 shadow-soft">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-4 w-1/2" style={{ animationDelay: `${baseDelay}s` }} />
                <Skeleton className="h-20 w-full rounded-lg" style={{ animationDelay: `${secondaryDelay}s` }} />
                <div className="flex gap-3">
                  <Skeleton className="h-4 w-24 rounded-full" style={{ animationDelay: `${tertiaryDelay}s` }} />
                  <Skeleton className="h-4 w-16 rounded-full" style={{ animationDelay: `${tertiaryDelay + 0.05}s` }} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search media titles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Media Type Filter */}
              <Select value={mediaTypeFilter} onValueChange={setMediaTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="game">Games</SelectItem>
                  <SelectItem value="movie">Movies</SelectItem>
                  <SelectItem value="tv show">TV Shows</SelectItem>
                  <SelectItem value="book">Books</SelectItem>
                  <SelectItem value="podcast">Podcasts</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>                  <SelectItem value="position_asc">Position (Low to High)</SelectItem>
                  <SelectItem value="position_desc">Position (High to Low)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <div className="space-y-4">
        {points.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                {searchTerm || mediaTypeFilter !== "all" 
                  ? "No WIGG points found matching your filters" 
                  : "No WIGG points yet. Be the first to add one!"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          points.map((point) => (
            <WiggPointCard
              key={point.id}
              point={point}
            />
          ))
        )}
      </div>

      {points.length === limit && (
        <div className="text-center">
          <Button variant="outline" onClick={fetchWiggPoints}>
            Load More
          </Button>
        </div>
      )}
    </div>
  );
};



