import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { FlameKindling, RefreshCw } from "lucide-react";
import { MediaSearch, type MediaSearchResult } from "@/components/media/MediaSearch";
import { SwipeRating, type Unit, type SwipeValue, type SwipeDirection } from "@/components/wigg/SwipeRating";
import { SessionRecap } from "@/components/wigg/SessionRecap";
import { GoodnessCurve, type GoodnessCurveData } from "@/components/wigg/GoodnessCurve";
import { MomentsPanel } from "@/components/wigg/MomentsPanel";
import { MomentCapture, type MediaType, type Moment } from "@/components/wigg/MomentCapture";
import { YouTubePlayer, type MediaPlayerControls } from "@/components/wigg/MediaPlayer";
import { WhyTagSelector, type SpoilerLevel } from "@/components/wigg/WhyTagSelector";
import { useWiggSession } from "@/hooks/useWiggSession";
import { useWiggPersistence } from "@/hooks/useWiggPersistence";


const SAMPLE_UNITS_TV: Unit[] = Array.from({ length: 8 }).map((_, i) => ({
  id: `ep-${i + 1}`,
  title: `S1E${i + 1}: ${[
    "Pilot",
    "Arrival",
    "The Trial",
    "Echoes",
    "Breakwater",
    "The Turn",
    "Uprising",
    "Finale",
  ][i]}`,
  ordinal: i + 1,
  subtype: "episode",
  runtimeSec: 42 * 60,
}));

const SAMPLE_UNITS_BOOK: Unit[] = Array.from({ length: 10 }).map((_, i) => ({
  id: `ch-${i + 1}`,
  title: `Ch. ${i + 1}: ${[
    "A Door Ajar",
    "Letters",
    "Lanterns",
    "The Gate",
    "Embers",
    "Witness",
    "The Long Night",
    "Ashfall",
    "The Oath",
    "Dawn",
  ][i]}`,
  ordinal: i + 1,
  subtype: "chapter",
  pages: 18 + Math.round(Math.random() * 12),
}));





export default function WiggSwipePreview() {
  const [mediaType, setMediaType] = useState<MediaType>("anime");
  const [playerControls, setPlayerControls] = useState<MediaPlayerControls | null>(null);
  const [whyTrayOpen, setWhyTrayOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaSearchResult | null>(null);
  const [goodnessCurveData, setGoodnessCurveData] = useState<GoodnessCurveData[]>([]);

  const {
    units,
    currentUnitIndex,
    moments,
    sessionStats,
    progress,
    setUnits,
    recordSwipe,
    addMoment,
    nextUnit,
    resetSession,
    setProgress,
  } = useWiggSession();

  const { saveWiggRating, saveMoment, saveMediaToDatabase } = useWiggPersistence();

  useEffect(() => {
    if (mediaType === "book" || mediaType === "manga") {
      setUnits(SAMPLE_UNITS_BOOK);
    } else {
      setUnits(SAMPLE_UNITS_TV);
    }
    resetSession();
    
    // Generate sample goodness curve data
    const curveData = units.map((unit, i) => ({
      unit: unit.ordinal,
      label: `${unit.subtype === "episode" ? "E" : "Ch"}${unit.ordinal}`,
      score: Math.max(0, Math.min(3, 0.4 + 0.3 * i + (i > 3 ? Math.random() * 0.6 : Math.random() * 0.3))),
    }));
    setGoodnessCurveData(curveData);
  }, [mediaType, setUnits, resetSession, units]);

  const currentUnit = units[currentUnitIndex] ?? null;

  const handleSwipe = async (direction: SwipeDirection, value: SwipeValue) => {
    recordSwipe(value);
    setWhyTrayOpen(true);
    setTimeout(() => nextUnit(), 100);

    // Save to database if media is selected
    if (selectedMedia && currentUnit) {
      await saveWiggRating({
        unitId: currentUnit.id,
        mediaId: selectedMedia.id,
        episodeId: currentUnit.subtype === "episode" ? currentUnit.id : undefined,
        value,
        position: currentUnit.ordinal,
        positionType: currentUnit.subtype === "episode" ? "episode" : "page",
      });
    }
  };

  const handleWhySave = (_tags: string[], _spoiler: SpoilerLevel) => {
    setWhyTrayOpen(false);
  };

  const handleAddMoment = async (moment: Moment) => {
    addMoment(moment);
    
    // Save to database if media is selected
    if (selectedMedia && currentUnit) {
      const episodeId = currentUnit.subtype === "episode" ? currentUnit.id : undefined;
      await saveMoment(moment, selectedMedia, episodeId);
    }
  };

  if (!selectedMedia) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <FlameKindling className="h-6 w-6" />
          <div>
            <h1 className="text-xl md:text-2xl font-bold">WIGG Prototype</h1>
            <p className="text-xs text-muted-foreground">
              Select media to start rating and capturing moments
            </p>
          </div>
        </div>
        <MediaSearch onMediaSelect={setSelectedMedia} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FlameKindling className="h-6 w-6" />
          <div>
            <h1 className="text-xl md:text-2xl font-bold">
              {selectedMedia.title}
            </h1>
            <p className="text-xs text-muted-foreground">
              Four-lane swipes • 1-tap reasons • spoiler-safe moments • YouTube-powered timestamps
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={mediaType} onValueChange={(v) => setMediaType(v as MediaType)}>
            <TabsList>
              <TabsTrigger value="tv">TV</TabsTrigger>
              <TabsTrigger value="anime">Anime</TabsTrigger>
              <TabsTrigger value="book">Book</TabsTrigger>
              <TabsTrigger value="manga">Manga</TabsTrigger>
              <TabsTrigger value="podcast">Podcast</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" onClick={() => setSelectedMedia(null)}>
            Change Media
          </Button>
          <Button variant="secondary" onClick={resetSession}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Rate this {mediaType === "book" || mediaType === "manga" ? "chapter" : "episode"}
              </CardTitle>
              <CardDescription className="text-xs">
                Swipe: Left (Skip) • Up (Okay) • Right (Good) • Down (Peak)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[22rem] flex items-center justify-center">
                <div className="w-full max-w-md">
                  <div className="relative">
                    <div className="absolute inset-0 -z-10 translate-y-4 scale-95 blur-sm opacity-50">
                      <div className="w-full h-72 rounded-2xl bg-muted" />
                    </div>
                    {currentUnit ? (
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

          <SessionRecap stats={sessionStats} />
        </div>

        <div className="space-y-4">
          <YouTubePlayer onReady={setPlayerControls} />
          <GoodnessCurve data={goodnessCurveData} />
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Your progress</CardTitle>
              <CardDescription className="text-xs">
                Slide to reveal non-spoiler summaries up to what you've reached.
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
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[min(900px,96vw)] z-40">
          <Card className="rounded-2xl shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Why did you rate it that way?</CardTitle>
              <CardDescription className="text-xs">
                Tap a few reasons (no typing needed) • Spoiler level helps others stay safe.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <WhyTagSelector
                selectedTags={[]}
                onTagsChange={() => {}}
                spoilerLevel="none"
                onSpoilerChange={() => {}}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setWhyTrayOpen(false)}>
                  Skip
                </Button>
                <Button onClick={() => handleWhySave([], "none")}>
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
        onAddMoment={handleAddMoment}
        externalPlayer={playerControls}
      />
    </div>
  );
}
