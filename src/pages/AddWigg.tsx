import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlameKindling, RefreshCw, Play, RotateCcw, ChevronDown, ChevronUp, Info } from "lucide-react";
import { usePageHeader } from "@/contexts/HeaderContext";
import { useAuth } from "@/hooks/useAuth";
import { MediaSearch, type MediaSearchResult } from "@/components/media/MediaSearch";
import { MomentCapture, type MediaType } from "@/components/wigg/MomentCapture";
import { type SpoilerLevel } from "@/components/wigg/WhyTagSelector";
import { YouTubePlayer, type MediaPlayerControls } from "@/components/wigg/MediaPlayer";
import { MomentsPanel } from "@/components/wigg/MomentsPanel";
import { SwipeRating, type SwipeValue } from "@/components/wigg/SwipeRating";
import { RealTimeVisualization } from "@/components/wigg/RealTimeVisualization";
import { WhyTagSelector } from "@/components/wigg/WhyTagSelector";
import { TimeBasedRating } from "@/components/wigg/TimeBasedRating";
import { GameCompletionTime } from "@/components/wigg/GameCompletionTime";
import { useUserGameData, useSetGameCompletionTime } from "@/hooks/useUserGameData";
import { useQueryClient } from "@tanstack/react-query";
import { useWiggSession } from "@/hooks/useWiggSession";
import { useWiggPersistence } from "@/hooks/useWiggPersistence";
import { useMediaUnits } from "@/hooks/useMediaUnits";



function AddWiggContent() {
  const location = useLocation();
  const { mode } = useParams<{ mode?: string }>();
  const [activeTab, setActiveTab] = useState(mode === "live" ? "live" : "retro");
  const [playerControls, setPlayerControls] = useState<MediaPlayerControls | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>("anime");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Retro mode specific state
  const [whyTrayOpen, setWhyTrayOpen] = useState(false);
  const [whyTags, setWhyTags] = useState<string[]>([]);
  const [whySpoiler, setWhySpoiler] = useState<SpoilerLevel>("none");
  const [currentRatings, setCurrentRatings] = useState<SwipeValue[]>([]);
  const [showGameTimeInput, setShowGameTimeInput] = useState(false);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [showVisualization, setShowVisualization] = useState(false);
  
  // Switch to retro tab when media type is game (games don't have live mode)
  useEffect(() => {
    if (mediaType === "game" && activeTab === "live") {
      setActiveTab("retro");
    }
  }, [mediaType, activeTab]);
  
  const {
    selectedMedia,
    units,
    currentUnitIndex,
    moments,
    progress,
    sessionStats,
    setSelectedMedia,
    setUnits,
    addMoment,
    resetSession,
    setProgress,
    recordSwipe,
    nextUnit,
  } = useWiggSession();

  const { saveMoment, saveMediaToDatabase } = useWiggPersistence();
  const { units: apiUnits, isLoading: unitsLoading, error: unitsError } = useMediaUnits(selectedMedia);
  
  // Game-specific hooks
  const { data: userGameData } = useUserGameData(selectedMedia?.id || '');
  const setGameCompletionTime = useSetGameCompletionTime();

  useEffect(() => {
    // Check if media was passed from MediaDetails page
    const passedMedia = location.state?.media;
    if (passedMedia && !selectedMedia) {
      const mediaSearchResult: MediaSearchResult = {
        id: passedMedia.id,
        title: passedMedia.title,
        type: passedMedia.type as MediaType,
        year: passedMedia.year,
        coverImage: passedMedia.posterUrl,
        externalIds: { tmdb_id: passedMedia.id }
      };
      // Save media to database to get the proper UUID
      handleMediaSelect(mediaSearchResult);
    }
  }, [location.state, selectedMedia, setSelectedMedia]);

  useEffect(() => {
    if (selectedMedia && apiUnits.length > 0) {
      setUnits(apiUnits);
      setMediaType(selectedMedia.type);
    }
  }, [selectedMedia, apiUnits, setUnits]);

  const handleMediaSelect = async (media: MediaSearchResult) => {
    try {
      const mediaId = await saveMediaToDatabase(media);
      setSelectedMedia({ ...media, id: mediaId });
      resetSession();
    } catch (error) {
      console.error("Failed to save media:", error);
    }
  };

  const handleAddMoment = async (moment: any) => {
    if (!selectedMedia) return;
    
    addMoment(moment);
    
    // Save to database in background
    const currentUnit = units[currentUnitIndex];
    const episodeId = currentUnit?.subtype === "episode" ? currentUnit.id : undefined;
    
    await saveMoment(moment, selectedMedia, episodeId);
  };

  const handleSwipeRating = (value: SwipeValue) => {
    recordSwipe(value);
    setCurrentRatings(prev => [...prev, value]);
    
    
    nextUnit();
  };

  const handleTimeBasedRating = async (hours: number, minutes: number, rating: SwipeValue, comment?: string) => {
    if (!selectedMedia) return;

    await saveMoment({
      id: `time-${Date.now()}`,
      unitId: `${hours}h${minutes}m`,
      anchorType: "timestamp",
      anchorValue: hours * 3600 + minutes * 60,
      whyTags: comment ? [comment] : [],
      spoilerLevel: "none",
      notes: `Gets good at ${hours}h ${minutes}m - Rating: ${rating}`,
    }, selectedMedia);

    setCurrentRatings(prev => [...prev, rating]);
  };

  const handleSceneRating = async (scene: any, rating: SwipeValue) => {
    if (!selectedMedia) return;

    const hours = Math.floor(scene.timestampSeconds / 3600);
    const minutes = Math.floor((scene.timestampSeconds % 3600) / 60);

    await saveMoment({
      id: `scene-${Date.now()}`,
      unitId: scene.id,
      anchorType: "timestamp",
      anchorValue: scene.timestampSeconds,
      whyTags: [scene.sceneName],
      spoilerLevel: "none",
      notes: `${scene.sceneName} (${hours}h ${minutes}m) - Rating: ${rating}`,
    }, selectedMedia);

    setCurrentRatings(prev => [...prev, rating]);
  };

  const handleGameCompletionTimeSet = async (completionTimeHours: number) => {
    if (!selectedMedia) return;
    
    try {
      await setGameCompletionTime.mutateAsync({
        mediaId: selectedMedia.id.toString(),
        completionTimeHours
      });
      setShowGameTimeInput(false);
    } catch (error) {
      console.error('Failed to set game completion time:', error);
    }
  };

  const handleEditPlaytime = () => {
    console.log('Edit playtime clicked');
    setShowGameTimeInput(true);
  };

  const handleSeek = (position: number) => {
    // Convert position (0-1) to unit index
    const unitIndex = Math.round(position * (units.length - 1));
    const newProgress = Math.max(1, unitIndex + 1); // progress is 1-based
    setProgress(newProgress);
  };

  const currentUnit = units[currentUnitIndex] || null;
  const isComplete = currentUnitIndex >= units.length;

  // Update page header when media/unit changes
  const currentUnitSubtitle = currentUnit ? `${currentUnit.subtype.charAt(0).toUpperCase() + currentUnit.subtype.slice(1)} ${currentUnit.ordinal}${currentUnit.title ? `: ${currentUnit.title}` : ''}` : undefined;
  
  usePageHeader({
    showBackButton: true,
    showHomeButton: true,
  });

  if (!selectedMedia) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl mobile-safe-bottom">
        <div className="flex items-center gap-3 mb-6">
          <FlameKindling className="h-6 w-6" />
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Rate Your Media</h1>
            <p className="text-xs text-muted-foreground">
              Choose your rating mode and start capturing your experience
            </p>
          </div>
        </div>
        
        <MediaSearch onMediaSelect={handleMediaSelect} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl mobile-safe-bottom">
      {/* Media Title and Subtitle */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
          {selectedMedia?.title || "Rate Your Media"}
        </h1>
        {mediaType !== "game" && (selectedMedia ? currentUnitSubtitle : "Live capture or retrospective rating modes") && (
          <p className="text-sm sm:text-base text-muted-foreground">
            {selectedMedia ? currentUnitSubtitle : "Live capture or retrospective rating modes"}
          </p>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {mediaType !== "game" && (
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="live" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Live
            </TabsTrigger>
            <TabsTrigger value="retro" className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Log
            </TabsTrigger>
          </TabsList>
        )}

        {/* Rating Visualization */}
        <RealTimeVisualization
          sessionStats={sessionStats}
          currentRatings={currentRatings}
          mediaType={mediaType}
          runtime={
            mediaType === "game" 
              ? userGameData?.completionTimeHours
              : mediaType === "movie"
              ? selectedMedia?.duration
              : mediaType === "book" || mediaType === "manga"
              ? units.reduce((total, unit) => total + (unit.pages || 0), 0)
              : undefined
          }
          currentPosition={
            units.length > 1 
              ? currentUnitIndex / (units.length - 1)
              : units.length === 1 
              ? 0.5 // Show playhead in middle if only one unit
              : undefined
          }
          onSeek={handleSeek}
        />

        <TabsContent value="live" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {(mediaType === "tv" || mediaType === "anime") && (
                <YouTubePlayer onReady={setPlayerControls} />
              )}
              
              <Card className="rounded-2xl shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Current Progress</CardTitle>
                  <CardDescription className="text-xs">
                    You're currently on: {currentUnit?.title || "No unit selected"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="text-lg font-semibold mb-2">
                      {currentUnit ? `${currentUnit.subtype.toUpperCase()} ${currentUnit.ordinal}` : "Ready to start"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Use the Moment Tool below to mark interesting points
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <MomentsPanel
                moments={moments}
                progressOrdinal={progress}
              />
              
              <Card className="rounded-2xl shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Progress Control</CardTitle>
                  <CardDescription className="text-xs">
                    Manually advance when you finish episodes/chapters
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setProgress(Math.max(1, progress - 1))}
                      disabled={progress <= 1}
                      variant="outline"
                      size="sm"
                    >
                      Previous
                    </Button>
                    <div className="flex-1 text-center text-sm">
                      {mediaType === "book" || mediaType === "manga" ? "Chapter" : "Episode"} {progress}
                    </div>
                    <Button
                      onClick={() => setProgress(progress + 1)}
                      variant="outline"
                      size="sm"
                    >
                      Next
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

        </TabsContent>

        <TabsContent value="retro" className="space-y-6">
          {!isComplete ? (
            <div className="space-y-6">
              {mediaType === "game" ? (
                !userGameData || showGameTimeInput ? (
                    <GameCompletionTime
                      gameTitle={selectedMedia.title}
                      onCompletionTimeSet={handleGameCompletionTimeSet}
                    />
                  ) : (
                    <TimeBasedRating
                      mediaType="game"
                      mediaTitle={selectedMedia.title}
                      mediaId={selectedMedia.id}
                      runtime={userGameData.completionTimeHours}
                      onRatingSubmit={handleTimeBasedRating}
                      onSceneRatingSubmit={handleSceneRating}
                      onEditPlaytime={handleEditPlaytime}
                      onReset={resetSession}
                    />
                  )
                ) : mediaType === "movie" ? (
                  <TimeBasedRating
                    mediaType="movie"
                    mediaTitle={selectedMedia.title}
                    mediaId={selectedMedia.id}
                    runtime={selectedMedia.duration}
                    onRatingSubmit={handleTimeBasedRating}
                    onSceneRatingSubmit={handleSceneRating}
                    onReset={resetSession}
                  />
                ) : (
                  <div className="space-y-4">
                    {/* Compact Progress Indicator */}
                    <div className="text-center py-4 border rounded-lg">
                      <div className="text-sm font-semibold mb-1">
                        {currentUnit ? `${currentUnit.subtype.toUpperCase()} ${currentUnit.ordinal}` : "Starting..."}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {currentUnit?.title || "Ready to begin"}
                      </div>
                    </div>
                    
                    {/* Compact Rating Buttons */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-center">
                        <Info 
                          className="h-4 w-4 text-muted-foreground cursor-help" 
                          title="Swipe gestures: ← ↑ → ↓ or keys A S D F"
                        />
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleSwipeRating(0)}
                          className="flex flex-col items-center gap-1 h-16 text-xs"
                        >
                          <span className="text-lg">😴</span>
                          <span>zzz</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleSwipeRating(1)}
                          className="flex flex-col items-center gap-1 h-16 text-xs"
                        >
                          <span className="text-lg">🌱</span>
                          <span>good</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleSwipeRating(2)}
                          className="flex flex-col items-center gap-1 h-16 text-xs"
                        >
                          <span className="text-lg">⚡</span>
                          <span>better</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleSwipeRating(3)}
                          className="flex flex-col items-center gap-1 h-16 text-xs"
                        >
                          <span className="text-lg">🔥</span>
                          <span>peak</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          ) : (
            <Card className="rounded-2xl shadow-sm text-center p-8">
              <CardTitle className="text-xl mb-2">Rating Complete!</CardTitle>
              <CardDescription className="mb-4">
                You've rated all {units.length} {units[0]?.subtype || "units"} of {selectedMedia.title}
              </CardDescription>
              <div className="flex justify-center gap-2">
                <Button onClick={resetSession}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Rate Again
                </Button>
                <Button variant="outline" onClick={() => setSelectedMedia(null)}>
                  Choose Different Media
                </Button>
              </div>
            </Card>
          )}

          {/* Combined Context Section */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Add Context (Optional)</CardTitle>
              <CardDescription className="text-xs">
                Mark interesting moments and add details about why this part was good/bad
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <WhyTagSelector
                selectedTags={whyTags}
                onTagsChange={setWhyTags}
                spoilerLevel={whySpoiler}
                onSpoilerChange={setWhySpoiler}
                customTags={customTags}
                onCustomTagsChange={setCustomTags}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AddWigg() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl mobile-safe-bottom">
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl mobile-safe-bottom">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Please log in to rate media
            </p>
            <Button onClick={() => window.location.href = '/auth'}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AddWiggContent />;
}