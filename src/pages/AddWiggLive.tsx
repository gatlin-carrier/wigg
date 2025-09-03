import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlameKindling, RefreshCw } from "lucide-react";
import { usePageHeader } from "@/contexts/HeaderContext";
import { useAuth } from "@/hooks/useAuth";
import { MediaSearch, type MediaSearchResult } from "@/components/media/MediaSearch";
import { MomentCapture, type MediaType } from "@/components/wigg/MomentCapture";
import { YouTubePlayer, type MediaPlayerControls } from "@/components/wigg/MediaPlayer";
import { MomentsPanel } from "@/components/wigg/MomentsPanel";
import { useWiggSession } from "@/hooks/useWiggSession";
import { useWiggPersistence } from "@/hooks/useWiggPersistence";

const SAMPLE_UNITS_TV = Array.from({ length: 8 }).map((_, i) => ({
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
  subtype: "episode" as const,
  runtimeSec: 42 * 60,
}));

const SAMPLE_UNITS_BOOK = Array.from({ length: 10 }).map((_, i) => ({
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
  subtype: "chapter" as const,
  pages: 18 + Math.round(Math.random() * 12),
}));

function AddWiggLiveContent() {
  const location = useLocation();
  const [playerControls, setPlayerControls] = useState<MediaPlayerControls | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>("anime");
  
  const {
    selectedMedia,
    units,
    currentUnitIndex,
    moments,
    progress,
    setSelectedMedia,
    setUnits,
    addMoment,
    resetSession,
    setProgress,
  } = useWiggSession();

  const { saveMoment, saveMediaToDatabase } = useWiggPersistence();

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
      // Set sample units based on media type
      if (selectedMedia.type === "book" || selectedMedia.type === "manga") {
        setUnits(SAMPLE_UNITS_BOOK);
      } else {
        setUnits(SAMPLE_UNITS_TV);
      }
      setMediaType(selectedMedia.type);
    }
  }, [selectedMedia, setUnits]);

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

  const currentUnit = units[currentUnitIndex] || null;

  if (!selectedMedia) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <FlameKindling className="h-6 w-6" />
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Live WIGG Capture</h1>
            <p className="text-xs text-muted-foreground">
              Mark moments in real-time while watching, reading, or listening
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
              Live capture mode • {moments.length} moments marked
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
    </div>
  );
}

export default function AddWiggLive() {
  const { user, loading } = useAuth();

  usePageHeader({
    title: "Live WIGG Capture",
    subtitle: "Mark moments in real-time while consuming media",
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
              Please log in to capture WIGG moments
            </p>
            <Button onClick={() => window.location.href = '/auth'}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AddWiggLiveContent />;
}