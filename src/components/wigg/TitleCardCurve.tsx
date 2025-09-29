import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTitleProgress } from '@/hooks/useTitleProgress';
import { useUserWiggs } from '@/hooks/useUserWiggs';
import { useUserWiggsDataLayer } from '@/data/hooks/useUserWiggsDataLayer';
import { useFeatureFlag } from '@/lib/featureFlags';
import { MiniGoodnessCurve } from './MiniGoodnessCurve';
import { Star, Play } from 'lucide-react';

export interface TitleCardCurveProps {
  titleId: string;
  title: string;
  coverArt: string;
  mediaType?: 'movie' | 'tv' | 'game' | 'book' | 'manga';
  year?: number;
  runtime?: number; // in minutes or pages (for display only)
  genre?: string[];
  onTitleClick?: () => void;
  className?: string;
  miniMinimal?: boolean;
  miniBadThreshold?: number;
  miniShowPeakMarker?: boolean;
  miniShowPeakPlayhead?: boolean;
}

export function TitleCardCurve({
  titleId,
  title,
  coverArt,
  mediaType = 'game',
  year,
  runtime,
  genre = [],
  onTitleClick,
  className = '',
  miniMinimal = false,
  miniBadThreshold,
  miniShowPeakMarker = true,
  miniShowPeakPlayhead = true,
}: TitleCardCurveProps) {
  const { data: progressData } = useTitleProgress(titleId);
  // Feature flag for data layer coexistence
  const useNewDataLayer = useFeatureFlag('title-card-curve-data-layer');
  const legacyWiggsData = useUserWiggs(titleId, { enabled: !useNewDataLayer });
  const newWiggsData = useUserWiggsDataLayer(titleId, { enabled: useNewDataLayer });
  const { data: wiggsData } = useNewDataLayer ? newWiggsData : legacyWiggsData;

  const values = useMemo(() => {
    const segs = progressData?.segments || [];
    if (segs.length === 0) return Array.from({ length: 16 }, () => 2);
    return segs.slice(0, 24).map(s => (s.userScore ?? s.meanScore ?? 2));
  }, [progressData?.segments]);

  const formatT2G = (pct?: number): string => {
    if (!pct || !runtime) return `${pct?.toFixed(0) || '?'}%`;
    const minutes = (pct / 100) * runtime;
    if (mediaType === 'game') {
      const h = Math.floor(minutes / 60); const m = Math.round(minutes % 60);
      return `${pct.toFixed(0)}% (~${h}h${m ? ` ${m}m` : ''})`;
    }
    if (mediaType === 'book' || mediaType === 'manga') return `${pct.toFixed(0)}% (~page ${Math.round(minutes)})`;
    if (minutes < 60) return `${pct.toFixed(0)}% (~${Math.round(minutes)}m)`;
    const h = Math.floor(minutes / 60); const m = Math.round(minutes % 60);
    return `${pct.toFixed(0)}% (~${h}h${m ? ` ${m}m` : ''})`;
  };

  return (
    <Card className={`group hover:shadow-md transition-all duration-200 cursor-pointer ${className}`} onClick={onTitleClick}>
      <CardContent className="p-0">
        <div className="flex gap-3 p-3">
          {/* Cover */}
          <div className="flex-shrink-0">
            <div
              className="w-16 h-24 bg-muted rounded border overflow-hidden group-hover:scale-105 transition-transform duration-200"
              style={{ backgroundImage: `url(${coverArt})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <h3 className="font-semibold text-sm leading-tight truncate">{title}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                {year && <span>{year}</span>}
                {runtime && <span>• {mediaType === 'game' ? `~${Math.round(runtime / 60)}h` : mediaType === 'book' || mediaType === 'manga' ? `${runtime} pages` : runtime < 60 ? `${runtime}m` : `${Math.floor(runtime/60)}h ${runtime%60||''}m`}</span>}
                {genre.slice(0, 2).map((g) => <span key={g}>• {g}</span>)}
              </div>
            </div>

            {/* Mini Goodness Curve */}
            <div className="space-y-1">
              <MiniGoodnessCurve
                values={values}
                height={28}
                threshold={miniMinimal ? undefined : 2}
                minimal={miniMinimal}
                badThreshold={miniBadThreshold}
                showPeakMarker={miniShowPeakMarker}
                showPeakPlayhead={miniShowPeakPlayhead}
              />
              {wiggsData?.t2gEstimatePct && (
                <div className="flex items-center gap-1 text-xs">
                  <Star className="h-3 w-3 text-primary" fill="currentColor" />
                  <span className="text-muted-foreground">Gets good {formatT2G(wiggsData.t2gEstimatePct)}</span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-xs">
              <div className="text-muted-foreground">Curve • simple preview</div>
              <div className="text-muted-foreground">{progressData?.segments?.length || 0} segments</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 flex flex-col gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="h-4 w-4" />
            </Button>
            {mediaType && (
              <Badge variant="outline" className="text-xs">{mediaType}</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
