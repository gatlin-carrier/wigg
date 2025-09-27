import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useTitleProgress } from '@/hooks/useTitleProgress';
import { useUserWiggs } from '@/hooks/useUserWiggs';
import { useUserWiggsDataLayer } from '@/data/hooks/useUserWiggsDataLayer';
import { useFeatureFlag } from '@/lib/featureFlags';
import { useMilestones } from '@/hooks/useMilestones';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { MilestonePath } from './MilestonePath';
import { PacingBarcode } from './PacingBarcode';
import { LollipopStrip } from './LollipopStrip';
import { RealtimeWiggOverlay } from './RealtimeWiggOverlay';
import { Star, Clock, BarChart3, Minus, Play, Settings } from 'lucide-react';

export interface TitleHeaderProps {
  titleId: string;
  title: string;
  subtitle?: string;
  coverArt?: string;
  mediaType?: 'movie' | 'tv' | 'game' | 'book' | 'manga';
  year?: number;
  runtime?: number;
  genre?: string[];
  rating?: string; // e.g., 'PG-13', 'M', 'E10+'
  developer?: string;
  publisher?: string;
  className?: string;
}

export function TitleHeader({
  titleId,
  title,
  subtitle,
  coverArt,
  mediaType = 'game',
  year,
  runtime,
  genre = [],
  rating,
  developer,
  publisher,
  className = ''
}: TitleHeaderProps) {
  const [visualMode, setVisualMode] = useState<'milestones' | 'barcode' | 'lollipop'>('milestones');
  const [showOverlay, setShowOverlay] = useState(false);
  
  const { data: progressData, isLoading: progressLoading } = useTitleProgress(titleId);

  // Feature flag for data layer coexistence
  const useNewDataLayer = useFeatureFlag('title-header-data-layer');
  const legacyWiggsData = useUserWiggs(titleId, { enabled: !useNewDataLayer });
  const newWiggsData = useUserWiggsDataLayer(titleId, { enabled: useNewDataLayer });
  const { data: wiggsData, isLoading: wiggsLoading } = useNewDataLayer ? newWiggsData : legacyWiggsData;

  const { data: milestonesData, isLoading: milestonesLoading } = useMilestones(titleId);
  const { preferences } = useUserPreferences();

  // Map user preference graph_type -> default visualization in header
  // - 'barcode' -> barcode view
  // - 'bars'    -> lollipop strip (1-D beads)
  // - otherwise -> milestones (default narrative map)
  const [hasAppliedPref, setHasAppliedPref] = useState(false);
  useEffect(() => {
    if (hasAppliedPref) return;
    const pref = preferences?.graph_type;
    if (!pref) return;
    if (pref === 'barcode') {
      setVisualMode('barcode');
      setHasAppliedPref(true);
    } else if (pref === 'bars') {
      setVisualMode('lollipop');
      setHasAppliedPref(true);
    } else {
      // curve/pulse or unknown: keep milestones as default
      setHasAppliedPref(true);
    }
  }, [preferences?.graph_type, hasAppliedPref]);

  const isLoading = progressLoading || wiggsLoading || milestonesLoading;

  const formatRuntime = (minutes?: number): string => {
    if (!minutes) return 'Unknown length';
    
    switch (mediaType) {
      case 'game': {
        return `~${Math.round(minutes / 60)} hours to complete`;
      }
      case 'book':
      case 'manga': {
        return `${minutes} pages`;
      }
      default: {
        if (minutes < 60) return `${minutes} minutes`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins === 0 ? `${hours} hours` : `${hours}h ${mins}m`;
      }
    }
  };

  const getMediaTypeIcon = () => {
    switch (mediaType) {
      case 'movie': return '🎬';
      case 'tv': return '📺';
      case 'game': return '🎮';
      case 'book': return '📚';
      case 'manga': return '📖';
      default: return '🎯';
    }
  };

  // Calculate segment scores for milestone path coloring
  const segmentScores = progressData?.segments?.map(segment => ({
    pct: (segment.startPct + segment.endPct) / 2,
    score: segment.userScore || segment.meanScore || 2
  })) || [];

  const userWiggCount = wiggsData?.entries?.length || 0;

  const renderVisualization = () => {
    if (isLoading) {
      return (
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
      );
    }

    switch (visualMode) {
      case 'milestones':
        return (
          <MilestonePath
            titleId={titleId}
            milestones={milestonesData?.items || []}
            segmentScores={segmentScores}
            onSelect={(milestoneId) => {
              // Could open milestone details or set focus
              console.log('Selected milestone:', milestoneId);
            }}
            className="bg-gradient-to-r from-background to-muted/20 rounded-lg border p-4"
            height={140}
          />
        );
      
          case 'barcode':
            return (
              <div className="bg-gradient-to-r from-background to-muted/20 rounded-lg border p-4">
            <PacingBarcode
              titleId={titleId}
              height={60}
              segmentCount={Math.min(40, Math.max(20, Math.floor(window.innerWidth / 15)))}
              segments={progressData?.segments || []}
              t2gEstimatePct={wiggsData?.t2gEstimatePct}
                  dataScope="community"
                  interactive={true}
                  onScrub={(pct) => {
                    // Visual feedback for scrubbing
                  }}
                  onMarkWigg={(pct) => {
                // Quick mark from barcode
                console.log('Quick mark at', pct);
              }}
            />
            <div className="text-xs text-center text-muted-foreground mt-2">
              Click to scrub • Long press to mark WIGG
            </div>
          </div>
        );
      
      case 'lollipop':
        return (
          <div className="bg-gradient-to-r from-background to-muted/20 rounded-lg border p-4">
            <LollipopStrip
              titleId={titleId}
              segments={progressData?.segments || []}
              t2gEstimatePct={wiggsData?.t2gEstimatePct}
              interactive={true}
              onMarkWigg={(pct) => {
                console.log('Mark from lollipop at', pct);
              }}
              height={80}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      <div className={`space-y-6 ${className}`}>
        {/* Header with Cover Art and Title */}
        <div className="flex gap-6">
          {/* Cover Art */}
          {coverArt && (
            <div className="flex-shrink-0">
              <div 
                className="w-24 h-36 bg-muted rounded-lg border shadow-md overflow-hidden"
                style={{
                  backgroundImage: `url(${coverArt})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
            </div>
          )}

          {/* Title and Meta */}
          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold leading-tight">{title}</h1>
                  {subtitle && (
                    <h2 className="text-lg text-muted-foreground mt-1">{subtitle}</h2>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    onClick={() => setShowOverlay(true)}
                    className="gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Start Session
                  </Button>
                  <Button variant="outline" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Metadata badges */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge variant="secondary">
                  {getMediaTypeIcon()} {mediaType}
                </Badge>
                {year && <Badge variant="outline">{year}</Badge>}
                {rating && <Badge variant="outline">{rating}</Badge>}
                {genre.slice(0, 3).map(g => (
                  <Badge key={g} variant="outline">{g}</Badge>
                ))}
                {runtime && (
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {formatRuntime(runtime)}
                  </Badge>
                )}
              </div>

              {/* Developer/Publisher info */}
              {(developer || publisher) && (
                <div className="text-sm text-muted-foreground mt-2">
                  {developer && <span>by {developer}</span>}
                  {developer && publisher && <span> • </span>}
                  {publisher && <span>published by {publisher}</span>}
                </div>
              )}
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-6 text-sm">
              {!isLoading && wiggsData?.t2gEstimatePct && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-primary" fill="currentColor" />
                  <span className="font-medium">Gets good: {wiggsData.t2gEstimatePct.toFixed(0)}%</span>
                </div>
              )}
              
              <div className="text-muted-foreground">
                {userWiggCount > 0 ? `${userWiggCount} moments logged` : 'No moments logged yet'}
              </div>

              {progressData?.segments && (
                <div className="text-muted-foreground">
                  {progressData.segments.length} segments analyzed
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Visualization Section */}
        <div className="space-y-4">
          {/* Visualization Controls */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Progress Visualization</h3>
            <div className="flex items-center gap-2">
              <Button
                variant={visualMode === 'milestones' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setVisualMode('milestones');
                }}
                disabled={!milestonesData?.items?.length}
              >
                Milestones
              </Button>
              <Button
                variant={visualMode === 'barcode' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setVisualMode('barcode');
                }}
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                Barcode
              </Button>
              <Button
                variant={visualMode === 'lollipop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setVisualMode('lollipop');
                }}
              >
                <Minus className="h-4 w-4 mr-1" />
                Strip
              </Button>
            </div>
          </div>

          {/* Visualization */}
          {renderVisualization()}

          {/* Visualization Help */}
          <div className="text-xs text-muted-foreground text-center">
            {visualMode === 'milestones' && 'Shows key story beats and progression markers'}
            {visualMode === 'barcode' && 'Compact overview of pacing and quality progression'}
            {visualMode === 'lollipop' && 'Detailed view of individual segment ratings'}
          </div>
        </div>
      </div>

      {/* Realtime Overlay */}
      <RealtimeWiggOverlay
        titleId={titleId}
        titleName={title}
        isOpen={showOverlay}
        onClose={() => setShowOverlay(false)}
        mediaType={mediaType}
        estimatedTotalMinutes={runtime}
      />
    </>
  );
}
