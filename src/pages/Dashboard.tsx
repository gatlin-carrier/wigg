import React, { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WiggPointForm } from "@/components/WiggPointForm";
import { GameRecommendations } from "@/components/GameRecommendations";
import { BookRecommendations } from "@/components/BookRecommendations";
import { MediaTileSkeletonRow } from "@/components/media/MediaTileSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useIsMobile } from "@/hooks/use-mobile";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";

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

      if (data) {
        // Handle JSONB format from database - extract just the types for ordering
        const preferences = Array.isArray((data as any).preferred_media_types) 
          ? ((data as any).preferred_media_types as Array<{type: string, priority: number}>)
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
  const [selectedMedia, setSelectedMedia] = useState<{ title: string; type: string } | null>(null);
  const isMobile = useIsMobile();
  const { isActive: isOnboardingActive } = useOnboarding();
  const shouldDeferDashboardContent = isOnboardingActive;
  
  // Configure global header for this page
  usePageHeader({
    title: "WIGG Dashboard",
    subtitle: isMobile ? undefined : "Discover when media gets good and track your own entries",
    showBackButton: true,
    showHomeButton: true,
  });

  const handleAddFromRecommendation = (mediaData: { title: string; type: string }) => {
    setSelectedMedia(mediaData);
  };

  const handleWiggPointSuccess = () => {
    setSelectedMedia(null);
  };

  const [tab, setTab] = useState<DashboardTab>('browse');
  const footer = (
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
  );

  const placeholderSections = isMobile ? 2 : 3;

  const deferredContent = (
    <div
      className="max-w-6xl mx-auto space-y-10 sm:space-y-12 h-[55vh] sm:h-auto overflow-hidden sm:overflow-visible"
    >
      <DashboardSkeleton
        placeholderSections={placeholderSections}
        showTabSkeleton
        testId="dashboard-loading-state"
      />
    </div>
  );

  return (
    <>
      <div className="container mx-auto px-4 py-6 space-y-8">
        {shouldDeferDashboardContent ? (
          deferredContent
        ) : (
          <DashboardTabs
            tab={tab}
            onTabChange={setTab}
            userPreferences={userPreferences}
            hiddenTypes={hiddenTypes}
            onAddFromRecommendation={handleAddFromRecommendation}
            selectedMedia={selectedMedia}
            onWiggPointSuccess={handleWiggPointSuccess}
            placeholderSections={placeholderSections}
          />
        )}
      </div>

      {footer}

      <OnboardingFlow />
    </>
  );
};

export default Dashboard;

type DashboardTab = 'feed' | 'browse' | 'add';

interface DashboardTabsProps {
  tab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  userPreferences: string[];
  hiddenTypes: string[];
  onAddFromRecommendation: (mediaData: { title: string; type: string }) => void;
  selectedMedia: { title: string; type: string } | null;
  onWiggPointSuccess: () => void;
  placeholderSections: number;
}

function DashboardTabs({
  tab,
  onTabChange,
  userPreferences,
  hiddenTypes,
  onAddFromRecommendation,
  selectedMedia,
  onWiggPointSuccess,
  placeholderSections,
}: DashboardTabsProps) {
  return (
    <div className="max-w-6xl mx-auto">
      <Tabs value={tab} onValueChange={(value) => onTabChange(value as DashboardTab)} className="space-y-8">
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
          <Suspense
            fallback={(
              <div className="space-y-4">
                <DashboardSkeleton placeholderSections={placeholderSections} showTabSkeleton={false} />
              </div>
            )}
          >
            <DashboardBrowseSections
              userPreferences={userPreferences}
              hiddenTypes={hiddenTypes}
              onAddFromRecommendation={onAddFromRecommendation}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="add" className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Add a WIGG Point</h2>
            <p className="text-muted-foreground">
              Help others discover when media gets good
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="p-6">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">Live Capture</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Mark moments in real-time while watching, reading, or listening
                  </p>
                </div>
                <Button
                  onClick={() => (window.location.href = '/add-wigg/live')}
                  className="w-full"
                  size="lg"
                >
                  Start Live Session
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">Retrospective Rating</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Rate episodes/chapters with swipe gestures or keyboard shortcuts (↑↓←→ or ASDF)
                  </p>
                </div>
                <Button
                  onClick={() => (window.location.href = '/add-wigg/retro')}
                  className="w-full"
                  size="lg"
                  variant="outline"
                >
                  Rate Episodes/Chapters
                </Button>
              </div>
            </Card>
          </div>

          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-4">
              Or use the classic single-point form:
            </div>
            <WiggPointForm initialData={selectedMedia as any} onSuccess={onWiggPointSuccess} />
          </div>
        </TabsContent>

        <TabsContent value="feed" className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Community Feed</h2>
            <p className="text-muted-foreground">Recent WIGG points from other users (prototype)</p>
          </div>
          <Feed />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface DashboardBrowseSectionsProps {
  userPreferences: string[];
  hiddenTypes: string[];
  onAddFromRecommendation: (mediaData: { title: string; type: string }) => void;
}

function DashboardBrowseSections({
  userPreferences,
  hiddenTypes,
  onAddFromRecommendation,
}: DashboardBrowseSectionsProps) {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Discover New Media</h2>
        <p className="text-muted-foreground">
          Find your next favorite show, game, book, or movie
        </p>
      </div>
      <div className="space-y-12">
        {userPreferences.map((mediaType) => {
          if (hiddenTypes.includes(mediaType)) return null;
          switch (mediaType) {
            case 'Movie':
              return (
                <TmdbPopular
                  key="movies"
                  kind="trending"
                  period="day"
                  onAdd={(item) => onAddFromRecommendation({ title: item.title, type: 'Movie' })}
                />
              );
            case 'TV Show':
              return (
                <TmdbPopularTv
                  key="tv"
                  kind="popular"
                  onAdd={(item) => onAddFromRecommendation({ title: item.title, type: 'TV Show' })}
                />
              );
            case 'Anime':
              return (
                <AnilistAnime
                  key="anime"
                  onAdd={(item) => onAddFromRecommendation({ title: item.title, type: item.type })}
                />
              );
            case 'Manga':
              return (
                <AnilistManga
                  key="manga"
                  onAdd={(item) => onAddFromRecommendation({ title: item.title, type: 'Book' })}
                />
              );
            case 'Game':
              return <GameRecommendations key="games" onAddGame={onAddFromRecommendation} />;
            case 'Book':
              return <BookRecommendations key="books" onAddBook={onAddFromRecommendation} />;
            case 'Podcast':
              return (
                <PodcastTrending
                  key="podcasts"
                  onAdd={(item) => onAddFromRecommendation({ title: item.title, type: 'Book' })}
                />
              );
            case 'Webtoons':
              return (
                <AnilistWebtoons
                  key="webtoons"
                  onAdd={(item) => onAddFromRecommendation({ title: item.title, type: 'Book' })}
                />
              );
            default:
              return null;
          }
        })}

        {!userPreferences.includes('Movie') && !hiddenTypes.includes('Movie') && (
          <TmdbPopular
            kind="trending"
            period="day"
            onAdd={(item) => onAddFromRecommendation({ title: item.title, type: 'Movie' })}
          />
        )}
        {!userPreferences.includes('TV Show') && !hiddenTypes.includes('TV Show') && (
          <TmdbPopularTv onAdd={(item) => onAddFromRecommendation({ title: item.title, type: 'TV Show' })} />
        )}
        {!userPreferences.includes('Anime') && !hiddenTypes.includes('Anime') && (
          <AnilistAnime onAdd={(item) => onAddFromRecommendation({ title: item.title, type: item.type })} />
        )}
        {!userPreferences.includes('Manga') && !hiddenTypes.includes('Manga') && (
          <AnilistManga onAdd={(item) => onAddFromRecommendation({ title: item.title, type: 'Book' })} />
        )}
        {!userPreferences.includes('Webtoons') && !hiddenTypes.includes('Webtoons') && (
          <AnilistWebtoons onAdd={(item) => onAddFromRecommendation({ title: item.title, type: 'Book' })} />
        )}
        {!userPreferences.includes('Game') && !hiddenTypes.includes('Game') && (
          <GameRecommendations onAddGame={onAddFromRecommendation} />
        )}
        {!userPreferences.includes('Podcast') && !hiddenTypes.includes('Podcast') && (
          <PodcastTrending onAdd={(item) => onAddFromRecommendation({ title: item.title, type: 'Book' })} />
        )}
        {!userPreferences.includes('Book') && !hiddenTypes.includes('Book') && (
          <BookRecommendations onAddBook={onAddFromRecommendation} />
        )}
      </div>
    </div>
  );
}

interface DashboardSkeletonProps {
  placeholderSections: number;
  showTabSkeleton?: boolean;
  testId?: string;
}

function DashboardSkeleton({ placeholderSections, showTabSkeleton = false, testId }: DashboardSkeletonProps) {
  return (
    <div className="space-y-10 sm:space-y-12" data-testid={testId}>
      {showTabSkeleton && (
        <div className="max-w-md mx-auto w-full">
          <div className="grid w-full grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton
                key={`dashboard-tab-skeleton-${index}`}
                className="h-10 rounded-full"
                style={{ animationDelay: `${(0.06 * index).toFixed(2)}s` }}
              />
            ))}
          </div>
        </div>
      )}
      <div className="space-y-8 sm:space-y-12">
        {Array.from({ length: placeholderSections }).map((_, idx) => {
          const baseDelay = 0.2 * idx;
          return (
            <div key={`dashboard-section-skeleton-${idx}`} className="space-y-6">
              <div className="space-y-2 text-center">
                <Skeleton
                  className="h-8 w-56 mx-auto"
                  style={{ animationDelay: `${baseDelay.toFixed(2)}s` }}
                />
                <Skeleton
                  className="h-4 w-72 mx-auto"
                  style={{ animationDelay: `${(baseDelay + 0.05).toFixed(2)}s` }}
                />
              </div>
              <MediaTileSkeletonRow baseDelay={baseDelay + 0.1} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
