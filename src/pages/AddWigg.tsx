import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlameKindling, RefreshCw, Play, RotateCcw } from "lucide-react";
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
import { useWiggSession } from "@/hooks/useWiggSession";
import { useWiggPersistence } from "@/hooks/useWiggPersistence";
import { useMediaUnits } from "@/hooks/useMediaUnits";



function AddWiggContent() {
  const location = useLocation();
  const { mode } = useParams<{ mode?: string }>();
  const [activeTab, setActiveTab] = useState(mode === "live" ? "live" : "retro");
  const [playerControls, setPlayerControls] = useState<MediaPlayerControls | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>("anime");
  
  // Retro mode specific state
  const [whyTrayOpen, setWhyTrayOpen] = useState(false);
  const [whyTags, setWhyTags] = useState<string[]>([]);
  const [whySpoiler, setWhySpoiler] = useState<SpoilerLevel>("none");
  const [currentRatings, setCurrentRatings] = useState<SwipeValue[]>([]);
  
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
      setSelectedMedia(mediaSearchResult);
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

  const currentUnit = units[currentUnitIndex] || null;
  const isComplete = currentUnitIndex >= units.length;

  if (!selectedMedia) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FlameKindling className="h-6 w-6" />
          <div>
            <h1 className="text-xl md:text-2xl font-bold">
              {selectedMedia.title}
            </h1>
            <p className="text-xs text-muted-foreground">
              {activeTab === "live" ? "Live capture mode" : "Retrospective rating"} • {moments.length} moments marked
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setSelectedMedia(null)}
          >
            Change Media
          </Button>
          <Button variant="secondary" onClick={resetSession}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="live" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Live Capture
          </TabsTrigger>
          <TabsTrigger value="retro" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Retrospective
          </TabsTrigger>
        </TabsList>

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

          <MomentCapture
            mediaType={mediaType}
            unit={currentUnit}
            onAddMoment={handleAddMoment}
            externalPlayer={playerControls}
          />
        </TabsContent>

        <TabsContent value="retro" className="space-y-6">
          {!isComplete ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">

                <Card className="rounded-2xl shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base">Current Progress</CardTitle>
                    <CardDescription className="text-xs">
                      Rate each {currentUnit?.subtype || "unit"} as you progress
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-4">
                      <div className="text-lg font-semibold mb-1">
                        {currentUnit ? `${currentUnit.subtype.toUpperCase()} ${currentUnit.ordinal}` : "Starting..."}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {currentUnit?.title || "Ready to begin"}
                      </div>
                    </div>
                    
                    <SwipeRating
                      onSwiped={(direction, value) => handleSwipeRating(value)}
                      unit={currentUnit}
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="rounded-2xl shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base">Real-Time Visualization</CardTitle>
                    <CardDescription className="text-xs">
                      Watch your rating curve develop as you progress
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RealTimeVisualization
                      sessionStats={sessionStats}
                      currentRatings={currentRatings}
                      variant="curve"
                    />
                  </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base">Session Stats</CardTitle>
                    <CardDescription className="text-xs">
                      Your rating distribution so far
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-red-500">{sessionStats.skip}</div>
                        <div className="text-muted-foreground">Filler</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-yellow-500">{sessionStats.ok}</div>
                        <div className="text-muted-foreground">Warming Up</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-500">{sessionStats.good}</div>
                        <div className="text-muted-foreground">Getting Good</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-purple-500">{sessionStats.peak}</div>
                        <div className="text-muted-foreground">Peak Perfection</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
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

          <MomentCapture
            mediaType={mediaType}
            unit={currentUnit}
            onAddMoment={handleAddMoment}
          />

          <WhyTagSelector
            selectedTags={whyTags}
            onTagsChange={setWhyTags}
            spoilerLevel={whySpoiler}
            onSpoilerChange={setWhySpoiler}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AddWigg() {
  const { user, loading } = useAuth();

  usePageHeader({
    title: "Rate Your Media",
    subtitle: "Live capture or retrospective rating modes",
    showBackButton: true,
    showHomeButton: true,
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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