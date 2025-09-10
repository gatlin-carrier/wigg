import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlameKindling, RefreshCw, Play, RotateCcw, ChevronDown, ChevronUp, Info } from "lucide-react";
import { usePageHeader } from "@/contexts/HeaderContext";
import { useAuth } from "@/hooks/useAuth";
import { MediaSearch, type MediaSearchResult } from "@/components/media/MediaSearch";
import { SeasonVolumeSelector } from "@/components/media/SeasonVolumeSelector";
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
import { RatingButtons } from "@/components/wigg/RatingButtons";
import { WiggRatingGrid } from "@/components/wigg/WiggRatingGrid";
import { RatingDial } from "@/components/wigg/RatingDial";
import { RatingSlider } from "@/components/wigg/RatingSlider";
import { AffectGrid } from "@/components/wigg/AffectGrid";
import { PacingBarcode } from "@/components/wigg/PacingBarcode";
import { NoteComposer } from "@/components/wigg/NoteComposer";
import { ContextChips } from "@/components/wigg/ContextChips";
import { useTitleProgress } from "@/hooks/useTitleProgress";
import { useUserWiggs } from "@/hooks/useUserWiggs";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserPreferences } from "@/hooks/useUserPreferences";



function AddWiggContent() {
  const location = useLocation();
  const { mode } = useParams<{ mode?: string }>();
  const [activeTab, setActiveTab] = useState(mode === "live" ? "live" : "retro");
  const [playerControls, setPlayerControls] = useState<MediaPlayerControls | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>("anime");
  const [selectedSeason, setSelectedSeason] = useState<number | undefined>();
  const [selectedVolume, setSelectedVolume] = useState<number | undefined>();
  const [selectedEpisode, setSelectedEpisode] = useState<{ id: string, title: string, number: number } | undefined>();
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
  const { preferences } = useUserPreferences();
  const isMobile = useIsMobile();
  const { data: progressData } = useTitleProgress(selectedMedia?.id || 'mobile');
  const { data: wiggsData } = useUserWiggs(selectedMedia?.id || 'mobile');
  // Game-specific hooks (declared early for dependent memos)
  const { data: userGameData } = useUserGameData(selectedMedia?.id || '');
  const setGameCompletionTime = useSetGameCompletionTime();

  // Compute preferred segment count:
  // - For episodic/chapter media, use number of units
  // - Otherwise, choose a logical number based on runtime/playtime
  const computedSegmentCount = React.useMemo(() => {
    // Units available? Use count when they look episodic/chapter-ish
    if (units && units.length > 1) {
      const isEpisodic = units[0]?.subtype === 'episode' || units[0]?.subtype === 'chapter';
      if (isEpisodic) return Math.max(2, Math.min(100, units.length));
    }

    // Fallback to runtime-based heuristics
    const minutes = mediaType === 'game'
      ? (userGameData?.completionTimeHours ? userGameData.completionTimeHours * 60 : (selectedMedia?.duration ?? 1800))
      : (selectedMedia?.duration ?? 120);

    if (minutes <= 45) return 12;      // shorts/episodes
    if (minutes <= 120) return 20;     // typical movie/anime cour
    if (minutes <= 240) return 24;     // long movies/miniseries
    if (minutes <= 600) return 30;     // games < 10h or very long films
    return 40;                         // very long games/shows
  }, [units, mediaType, userGameData?.completionTimeHours, selectedMedia?.duration]);

  // Build labels per segment when episodic/chapter-based
  const segmentLabels = React.useMemo(() => {
    if (!units || units.length <= 1) return undefined as string[] | undefined;
    const segCount = computedSegmentCount;
    return Array.from({ length: segCount }, (_, i) => {
      const ord = Math.max(1, Math.min(units.length, Math.round(((i + 0.5) / segCount) * units.length)));
      const u = units[ord - 1];
      const kind = u?.subtype === 'chapter' ? 'Chapter' : 'Episode';
      return `${kind} ${ord}`;
    });
  }, [units, computedSegmentCount]);

  // Current playhead percent based on current unit progress (if available)
  const currentPlayheadPct = React.useMemo(() => {
    if (!units || units.length === 0) return undefined as number | undefined;
    const segCount = computedSegmentCount;
    const ord = Math.max(1, Math.min(units.length, progress || 1));
    // Position across full timeline as percent (center of current unit)
    return ((ord - 0.5) / units.length) * 100;
  }, [units, computedSegmentCount, progress]);

  // Selected segment index to highlight the current episode/chapter
  const selectedSegmentIndex = React.useMemo(() => {
    if (!units || units.length <= 1) return undefined as number | undefined;
    const segCount = computedSegmentCount;
    const ord = Math.max(1, Math.min(units.length, progress || 1));
    const pos = (ord - 0.5) / units.length; // 0..1 center of current unit
    const idx = Math.round(pos * segCount - 0.5);
    return Math.max(0, Math.min(segCount - 1, idx));
  }, [units, computedSegmentCount, progress]);
  

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

  // Focus a specific unit (episode/chapter) if provided by navigation state
  useEffect(() => {
    const state: any = (location as any).state;
    const focusOrdinal = state && (state as any).focusUnitOrdinal as number | undefined;
    if (focusOrdinal && units.length > 0) {
      setProgress(focusOrdinal);
    }
  }, [location, units, setProgress]);

  const handleMediaSelect = async (media: MediaSearchResult) => {
    try {
      const mediaId = await saveMediaToDatabase(media);
      const updatedMedia = { ...media, id: mediaId };
      setSelectedMedia(updatedMedia);
      resetSession();
    } catch (error) {
      console.error("Failed to save media:", error);
    }
  };

  const handleSeasonVolumeSelect = (seasonNumber?: number, volumeNumber?: number, episodeData?: { id: string, title: string, number: number }) => {
    setSelectedSeason(seasonNumber);
    setSelectedVolume(volumeNumber);
    setSelectedEpisode(episodeData);
    // Reset session when season/volume/episode changes to refresh units
    resetSession();
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
  const currentUnitSubtitle = React.useMemo(() => {
    // If episode is selected, show episode info
    if (selectedEpisode) {
      return `Episode ${selectedEpisode.number}${selectedEpisode.title ? `: ${selectedEpisode.title}` : ''}`;
    }
    
    // Otherwise use current unit info
    if (currentUnit) {
      return `${currentUnit.subtype.charAt(0).toUpperCase() + currentUnit.subtype.slice(1)} ${currentUnit.ordinal}${currentUnit.title ? `: ${currentUnit.title}` : ''}`;
    }
    
    return undefined;
  }, [selectedEpisode, currentUnit]);
  
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
          {selectedSeason && (
            <span className="text-lg sm:text-xl lg:text-2xl text-muted-foreground ml-2">
              Season {selectedSeason}
            </span>
          )}
          {selectedVolume && (
            <span className="text-lg sm:text-xl lg:text-2xl text-muted-foreground ml-2">
              Volume {selectedVolume}
            </span>
          )}
        </h1>
        {mediaType !== "game" && (selectedMedia ? currentUnitSubtitle : "Live capture or retrospective rating modes") && (
          <p className="text-sm sm:text-base text-muted-foreground">
            {selectedMedia ? currentUnitSubtitle : "Live capture or retrospective rating modes"}
          </p>
        )}
      </div>

      {/* Season/Volume Selector */}
      {selectedMedia && (
        <SeasonVolumeSelector 
          media={selectedMedia}
          onSelectionChange={handleSeasonVolumeSelect}
          className="mb-6"
        />
      )}

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
          titleId={selectedMedia?.id || ""}
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
          totalUnits={
            (mediaType === "tv" || mediaType === "anime" || mediaType === "book" || mediaType === "manga")
              ? units.length
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
              {/* Global barcode overview (all media types) */}
              {preferences?.graph_type === 'barcode' && (
                <div className="space-y-2">
                  <div id="barcode-target">
                    <PacingBarcode
                      titleId={selectedMedia?.id || 'addwigg'}
                      height={60}
                      segmentCount={computedSegmentCount}
                      segments={progressData?.segments || []}
                      t2gEstimatePct={wiggsData?.t2gEstimatePct}
                      dataScope="community"
                      colorMode="heat"
                      className="max-w-[600px] mx-auto"
                      currentPct={currentPlayheadPct}
                      playheadVisibility={(units && units.length > 1 && (units[0]?.subtype === 'episode' || units[0]?.subtype === 'chapter')) ? 'never' : 'hover'}
                      selectedSegmentIndex={selectedSegmentIndex}
                      highlightOnHover={Boolean(units && units.length > 1)}
                      segmentLabels={segmentLabels}
                      onSegmentClick={(idx: number) => {
                        if (!units || units.length <= 1) return;
                        const segCount = computedSegmentCount;
                        const ord = Math.max(1, Math.min(units.length, Math.round(((idx + 0.5) / segCount) * units.length)));
                        setProgress(ord);
                      }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground text-center">
                    {wiggsData?.t2gEstimatePct ? `T2G ~${wiggsData.t2gEstimatePct.toFixed(0)}%` : 'Progress overview'}
                  </div>
                </div>
              )}
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
                    {/* Rating UI (preference-driven) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-center">
                        <Info
                          className="h-4 w-4 text-muted-foreground cursor-help"
                          title="Swipe: ← ↑ → ↓ or keys A S D F. Change rating UI in preferences."
                        />
                      </div>
                      {(() => {
                        const ui = isMobile ? 'slider' : (preferences?.rating_ui || 'buttons');
                        if (ui === 'dial') {
                          return (
                            <div className="flex items-center justify-center">
                              <RatingDial value={2 as SwipeValue} onChange={(v) => handleSwipeRating(v)} />
                            </div>
                          );
                        }
                        if (ui === 'slider') {
                          return (
                            <div className="flex items-center justify-center">
                              <RatingSlider value={2 as SwipeValue} onChange={(v) => handleSwipeRating(v)} />
                            </div>
                          );
                        }
                        if (ui === 'grid') {
                          return (
                            <div className="flex items-center justify-center">
                              <WiggRatingGrid onChange={(v: any) => handleSwipeRating(v)} />
                            </div>
                          );
                        }
                        if (ui === 'affect') {
                          return (
                            <div className="flex items-center justify-center">
                              <AffectGrid
                                size={220}
                                onChange={(val) => {
                                  const level = val.quality < 0.25 ? 0 : val.quality < 0.5 ? 1 : val.quality < 0.75 ? 2 : 3;
                                  handleSwipeRating(level as SwipeValue);
                                }}
                              />
                            </div>
                          );
                        }
                        if (ui === 'buttons') {
                          return (
                            <div className="flex items-center justify-center">
                              <RatingButtons value={undefined} onChange={(v) => handleSwipeRating(v)} />
                            </div>
                          );
                        }
                        if (ui === 'swipe') {
                          return (
                            <div className="flex items-center justify-center">
                              <SwipeRating unit={currentUnit as any} onSwiped={(v) => handleSwipeRating(v)} />
                            </div>
                          );
                        }
                        if (ui === 'hybrid') {
                          return (
                            <div className="space-y-4">
                              <div className="flex items-center justify-center">
                                <RatingDial value={2 as SwipeValue} onChange={(v) => handleSwipeRating(v)} />
                              </div>
                              <div className="flex items-center justify-center">
                                <RatingButtons value={undefined} onChange={(v) => handleSwipeRating(v)} />
                              </div>
                            </div>
                          );
                        }
                        if (ui === 'paint') {
                          const toSwipe = (score: number): SwipeValue => (score < 0.75 ? 0 : score < 1.5 ? 1 : score < 2.5 ? 2 : 3) as SwipeValue;
                          return (
                            <div className="flex items-center justify-center">
                              <div className="w-full max-w-[600px]">
                                <PacingBarcode
                                  titleId={selectedMedia?.id || 'paint-local'}
                                  height={60}
                                  segmentCount={computedSegmentCount}
                                  segments={progressData?.segments || []}
                                  dataScope="local"
                                  interactive={false}
                                  editable={true}
                                  onPaintSegmentScore={(_, score) => handleSwipeRating(toSwipe(score))}
                                  editIdleTimeoutMs={10000}
                                />
                                <div className="text-xs text-center text-muted-foreground mt-2">
                                  Paint to choose intensity; we’ll convert to zzz/good/better/peak
                                </div>
                              </div>
                            </div>
                          );
                        }
                        // default fallback
                        return (
                          <WiggRatingGrid onChange={(v: any) => handleSwipeRating(v)} />
                        );
                      })()}
                    </div>
                    {/* Mobile notes/context directly inline */}
                    {isMobile && (
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm font-medium mb-2">Notes</div>
                          <NoteComposer />
                        </div>
                        <div>
                          <div className="text-sm font-medium mb-2">Add context</div>
                          <ContextChips
                            options={[
                              { id: 'world', label: 'World opens', emoji: '🗺️' },
                              { id: 'twist', label: 'Plot twist', emoji: '🤯' },
                              { id: 'music', label: 'Music hits', emoji: '🎵' },
                              { id: 'fight', label: 'Fight', emoji: '⚔️' },
                              { id: 'art', label: 'Art spike', emoji: '🎨' },
                            ]}
                            selected={[]}
                            onChange={() => {}}
                          />
                        </div>
                      </div>
                    )}
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
          {!isMobile && (
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
          )}
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
