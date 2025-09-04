import { useState, useEffect } from "react";
import { WiggPointCard } from "./WiggPointCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, SortAsc } from "lucide-react";
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
  vote_score: number;
  user_vote?: number;
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
          break;
        case "highest_rated":
          // Ordering by an aggregate alias isn't supported server-side here; sort client-side below
          break;
        case "position_asc":
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
        vote_score: 0, // Simplified for now to fix database error
        user_vote: 0
      }));

      if (sortBy === "highest_rated") {
        transformedPoints = transformedPoints.sort((a, b) => b.vote_score - a.vote_score);
      }

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

  const handleVoteUpdate = (pointId: string, newScore: number, userVote: number) => {
    setPoints(prev => prev.map(point => 
      point.id === pointId 
        ? { ...point, vote_score: newScore, user_vote: userVote }
        : point
    ));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="w-full">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-20 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
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
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="highest_rated">Highest Rated</SelectItem>
                  <SelectItem value="position_asc">Position (Low to High)</SelectItem>
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
              onVoteUpdate={handleVoteUpdate}
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
