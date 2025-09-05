import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { FlameKindling, RefreshCw } from "lucide-react";
import { usePageHeader } from "@/contexts/HeaderContext";
import { useAuth } from "@/hooks/useAuth";
import { MediaSearch, type MediaSearchResult } from "@/components/media/MediaSearch";
import { SwipeRating, type Unit, type SwipeValue, type SwipeDirection } from "@/components/wigg/SwipeRating";
import { SessionRecap } from "@/components/wigg/SessionRecap";
import { GoodnessCurve, type GoodnessCurveData } from "@/components/wigg/GoodnessCurve";
import { MomentsPanel } from "@/components/wigg/MomentsPanel";
import { MomentCapture, type MediaType } from "@/components/wigg/MomentCapture";
import { WhyTagSelector, type SpoilerLevel } from "@/components/wigg/WhyTagSelector";
import { RealTimeVisualization } from "@/components/wigg/RealTimeVisualization";
import { TimeBasedRating } from "@/components/wigg/TimeBasedRating";
import { useWiggSession } from "@/hooks/useWiggSession";
import { useWiggPersistence } from "@/hooks/useWiggPersistence";
import { useMediaUnits } from "@/hooks/useMediaUnits";


function AddWiggRetroContent() {
  const location = useLocation();
  const [mediaType, setMediaType] = useState<MediaType>("anime");
  const [whyTrayOpen, setWhyTrayOpen] = useState(false);
  const [whyTags, setWhyTags] = useState<string[]>([]);
  const [whySpoiler, setWhySpoiler] = useState<SpoilerLevel>("none");
  const [goodnessCurveData, setGoodnessCurveData] = useState<GoodnessCurveData[]>([]);
  const [currentRatings, setCurrentRatings] = useState<SwipeValue[]>([]);

  const {
    selectedMedia,
    units,
    currentUnitIndex,
    moments,
    sessionStats,
    progress,
    setSelectedMedia,
    setUnits,
    recordSwipe,
    addMoment,
    nextUnit,
    resetSession,
    setProgress,
  } = useWiggSession();

  const { saveWiggRating, saveMoment, saveMediaToDatabase } = useWiggPersistence();
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
    if (selectedMedia) {
      setMediaType(selectedMedia.type as MediaType);
    }
    
    if (selectedMedia && apiUnits.length > 0) {
      setUnits(apiUnits);
      
      // Generate sample goodness curve data
      const curveData = apiUnits.map((unit, i) => ({
        unit: unit.ordinal,
        label: `${unit.subtype === "episode" ? "E" : "Ch"}${unit.ordinal}`,
        score: Math.max(0, Math.min(3, 0.4 + 0.3 * i + (i > 3 ? Math.random() * 0.6 : Math.random() * 0.3))),
      }));
      setGoodnessCurveData(curveData);
    }
  }, [selectedMedia, apiUnits, setUnits]);

  const handleMediaSelect = async (media: MediaSearchResult) => {
    try {
      const mediaId = await saveMediaToDatabase(media);
      setSelectedMedia({ ...media, id: mediaId });
      setCurrentRatings([]);
      resetSession();
    } catch (error) {
      console.error("Failed to save media:", error);
    }
  };

  const handleSwipe = async (direction: SwipeDirection, value: SwipeValue) => {
    if (!selectedMedia || !currentUnit) return;

    // Update real-time ratings
    setCurrentRatings(prev => [...prev, value]);
    
    recordSwipe(value);
    setWhyTrayOpen(true);
    
    // Auto-advance to next unit
    setTimeout(() => nextUnit(), 100);

    // Save rating to database
    await saveWiggRating({
      mediaId: selectedMedia.id,
      value,
      position: currentUnit.ordinal,
      positionType: currentUnit.subtype === "episode" ? "episode" : "page",
    });
  };

  const handleWhySave = async (tags: string[], spoilerLevel: SpoilerLevel) => {
    setWhyTrayOpen(false);
    // Additional metadata could be saved here if needed
  };

  const handleTimeBasedRating = async (hours: number, minutes: number, rating: SwipeValue, comment?: string) => {
    if (!selectedMedia) return;

    await saveWiggRating({
      mediaId: selectedMedia.id,
      value: rating,
      position: hours * 60 + minutes, // Store total minutes
      positionType: "minute",
    });

    // Update local state for visualization
    setCurrentRatings(prev => [...prev, rating]);
  };

  const currentUnit = units[currentUnitIndex] || null;

  if (!selectedMedia) {
    return (
      <div className="w-full px-2 py-2 sm:p-4 md:p-6 overflow-x-hidden">
        <div className="flex items-center gap-3 mb-6">
          <FlameKindling className="h-6 w-6" />
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Retrospective Rating</h1>
            <p className="text-xs text-muted-foreground">
              Rate episodes or chapters after you've finished them
            </p>
          </div>
        </div>
        
        <MediaSearch onMediaSelect={handleMediaSelect} />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen px-2 py-2 sm:p-4 md:p-6 overflow-x-hidden max-w-none">
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <FlameKindling className="h-6 w-6 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">
              {selectedMedia.title}
            </h1>
            <p className="text-xs text-muted-foreground">
              Retrospective rating • {sessionStats.n} units rated • Type: {mediaType}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setSelectedMedia(null)}
            className="w-full sm:w-auto"
          >
            Change Media
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => { setCurrentRatings([]); resetSession(); }}
            className="w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      <div className="w-full space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
        <div className="w-full space-y-4">
          {(mediaType === "movie" || mediaType === "game") ? (
            <TimeBasedRating
              mediaType={mediaType as "movie" | "game"}
              mediaTitle={selectedMedia.title}
              onRatingSubmit={handleTimeBasedRating}
            />
          ) : (
            <Card className="rounded-2xl shadow-sm w-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Rate this {mediaType === "book" || mediaType === "manga" ? "chapter" : "episode"}
                </CardTitle>
                <CardDescription className="text-xs">
                  <span className="hidden sm:inline">Swipe or Keyboard: ←A (zzz) • ↑S (good) • →D (better) • ↓F (peak)</span>
                  <span className="sm:hidden">Swipe or use A/S/D/F keys</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[22rem] flex items-center justify-center px-2">
                  <div className="w-full max-w-sm sm:max-w-md">
                    <div className="relative">
                      <div className="absolute inset-0 -z-10 translate-y-4 scale-95 blur-sm opacity-50">
                        <div className="w-full h-72 rounded-2xl bg-muted" />
                      </div>
                      {unitsLoading ? (
                        <div className="h-72 rounded-2xl border border-dashed grid place-items-center text-sm text-muted-foreground">
                          Loading episodes...
                        </div>
                      ) : unitsError ? (
                        <div className="h-72 rounded-2xl border border-dashed grid place-items-center text-sm text-destructive">
                          Error loading episodes: {unitsError.message}
                        </div>
                      ) : currentUnit ? (
                        <SwipeRating unit={currentUnit} onSwiped={handleSwipe} />
                      ) : (
                        <div className="h-72 rounded-2xl border border-dashed grid place-items-center text-sm text-muted-foreground">
                          Stack complete! 🎉
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <SessionRecap stats={sessionStats} />
        </div>

        <div className="w-full space-y-4">

          {/* Real-time Personal Graph */}
          <Card className="rounded-2xl shadow-sm w-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Your Live Progress</CardTitle>
              <CardDescription className="text-xs">
                Real-time view of your ratings as you go
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <RealTimeVisualization 
                  sessionStats={sessionStats} 
                  currentRatings={currentRatings}
                />
                <div className="grid grid-cols-3 gap-2">
                  {(["curve", "bars", "pulse"] as const).map((variant) => (
                    <div key={variant} className="text-center">
                      <RealTimeVisualization 
                        sessionStats={sessionStats} 
                        currentRatings={currentRatings}
                        variant={variant}
                      />
                      <div className="text-xs mt-1 capitalize text-muted-foreground">{variant}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Community Consensus Graph */}
          <GoodnessCurve data={goodnessCurveData || []} />
          
          <Card className="rounded-2xl shadow-sm w-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Progress Control</CardTitle>
              <CardDescription className="text-xs">
                Set how far you've progressed to see non-spoiler summaries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Label className="text-xs w-16">Reached</Label>
                <Slider
                  value={[progress]}
                  onValueChange={(v) => setProgress(v[0])}
                  min={1}
                  max={units[units.length - 1]?.ordinal ?? 10}
                  className="w-full"
                />
                <div className="text-xs w-10 text-right">{progress}</div>
              </div>
            </CardContent>
          </Card>
          
          <MomentsPanel moments={moments} progressOrdinal={progress} />
        </div>
      </div>

      {/* Why Tray for post-swipe feedback */}
      {whyTrayOpen && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-4xl mx-auto">
          <Card className="rounded-2xl shadow-lg w-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Why did you rate it that way?</CardTitle>
              <CardDescription className="text-xs">
                Tap a few reasons (no typing needed) • Spoiler level helps others stay safe.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1 mb-3 text-xs">
                <Badge variant="outline" className="text-xs flex-shrink-0">💤 zzz: Slow pacing</Badge>
                <Badge variant="outline" className="text-xs flex-shrink-0">🌱 good: Building up</Badge>
                <Badge variant="outline" className="text-xs flex-shrink-0">⚡ better: Engaging</Badge>
                <Badge variant="outline" className="text-xs flex-shrink-0">🔥 peak: Excellence</Badge>
              </div>
              
              <WhyTagSelector
                selectedTags={whyTags}
                onTagsChange={setWhyTags}
                spoilerLevel={whySpoiler}
                onSpoilerChange={setWhySpoiler}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setWhyTrayOpen(false)}>
                  Skip
                </Button>
                <Button onClick={() => handleWhySave(whyTags, whySpoiler)}>
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <MomentCapture
        mediaType={mediaType}
        unit={currentUnit}
        onAddMoment={addMoment}
      />
    </div>
  );
}

export default function AddWiggRetro() {
  const { user, loading } = useAuth();

  usePageHeader({
    title: "Retrospective Rating",
    subtitle: "Rate episodes/chapters after finishing them",
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
              Please log in to create WIGG ratings
            </p>
            <Button onClick={() => window.location.href = '/auth'}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AddWiggRetroContent />;
}