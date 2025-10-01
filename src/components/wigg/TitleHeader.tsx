import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTitleProgress } from '@/hooks/useTitleProgress';
import { useUserWiggs } from '@/hooks/useUserWiggs';
import { useUserWiggsDataLayer } from '@/data/hooks/useUserWiggsDataLayer';
import { useFeatureFlag } from '@/lib/featureFlags';
import { useMilestones } from '@/hooks/useMilestones';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { MilestonePath } from './MilestonePath';
import { PacingBarcode } from './PacingBarcode';
import { LollipopStrip } from './LollipopStrip';
import { BarChart3, Minus } from 'lucide-react';

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
  className = ''
}: TitleHeaderProps) {
  const [visualMode, setVisualMode] = useState<'milestones' | 'barcode' | 'lollipop'>('milestones');

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

  // Calculate segment scores for milestone path coloring
  const segmentScores = progressData?.segments?.map(segment => ({
    pct: (segment.startPct + segment.endPct) / 2,
    score: segment.userScore || segment.meanScore || 2
  })) || [];

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
    <div className={`space-y-4 ${className}`}>
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

      {renderVisualization()}

      <div className="text-xs text-muted-foreground text-center">
        {visualMode === 'milestones' && 'Shows key story beats and progression markers'}
        {visualMode === 'barcode' && 'Compact overview of pacing and quality progression'}
        {visualMode === 'lollipop' && 'Detailed view of individual segment ratings'}
      </div>
    </div>
  );
}
