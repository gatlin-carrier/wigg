import { useMemo, useState } from "react";
import { WiggPointCard } from "./WiggPointCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ListWiggPointsParams, MediaType, useWiggPoints } from "@/data";

export type MediaFilter = "all" | MediaType;
export type SortOption = "newest" | "oldest" | "position_asc" | "position_desc";

interface WiggPointsListProps {
  limit?: number;
  showFilters?: boolean;
  userId?: string; // If provided, only show points from this user
}

export const WiggPointsList = ({
  limit = 20,
  showFilters = true,
  userId,
}: WiggPointsListProps) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [mediaTypeFilter, setMediaTypeFilter] = useState<MediaFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [effectiveLimit, setEffectiveLimit] = useState(limit);

  const queryParams = useMemo<ListWiggPointsParams>(() => ({
    limit: effectiveLimit,
    searchTerm: searchTerm.trim() || undefined,
    mediaType: mediaTypeFilter,
    sortBy,
    userId,
  }), [effectiveLimit, mediaTypeFilter, searchTerm, sortBy, userId]);

  const { data: points = [], isLoading, isFetching, refetch } = useWiggPoints(queryParams, {
    keepPreviousData: true,
    enabled: userId ? Boolean(user?.id) : true,
  });

  const handleLoadMore = () => {
    setEffectiveLimit(prev => prev + limit);
    refetch();
  };

  if (isLoading) {
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
              <Select value={mediaTypeFilter} onValueChange={(value: MediaFilter) => setMediaTypeFilter(value)}>
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
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
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
        {points.length === 0 && !isFetching ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                {searchTerm || mediaTypeFilter !== "all"
                  ? "No WIGG points found matching your filters"
                  : "No WIGG points yet. Be the first to add one!"}
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

      {points.length >= effectiveLimit && (
        <div className="text-center">
          <Button variant="outline" onClick={handleLoadMore} disabled={isFetching}>
            {isFetching ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
};
