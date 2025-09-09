import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTitleProgress } from '@/hooks/useTitleProgress';
import { useUserWiggs } from '@/hooks/useUserWiggs';
import { PacingBarcode } from './PacingBarcode';
import { RealtimeWiggOverlay } from './RealtimeWiggOverlay';
import { Star, Clock, TrendingUp, Play } from 'lucide-react';

export interface TitleCardProps {
  titleId: string;
  title: string;
  coverArt: string;
  mediaType?: 'movie' | 'tv' | 'game' | 'book' | 'manga';
  year?: number;
  runtime?: number; // in minutes for movies, hours for games, pages for books
  genre?: string[];
  onTitleClick?: () => void;
  className?: string;
}

export function TitleCard({
  titleId,
  title,
  coverArt,
  mediaType = 'game',
  year,
  runtime,
  genre = [],
  onTitleClick,
  className = ''
}: TitleCardProps) {
  const [showOverlay, setShowOverlay] = useState(false);
  
  const { data: progressData, isLoading: progressLoading } = useTitleProgress(titleId);
  const { data: wiggsData, isLoading: wiggsLoading } = useUserWiggs(titleId);

  const isLoading = progressLoading || wiggsLoading;

  // Calculate pacing insights
  const getPacingInsight = (): { label: string; icon: React.ReactNode } => {
    if (!progressData?.segments) return { label: 'Unknown pacing', icon: <TrendingUp className="h-3 w-3" /> };

    const scores = progressData.segments
      .map(s => s.userScore || s.meanScore)
      .filter(Boolean) as number[];

    if (scores.length < 3) return { label: 'Insufficient data', icon: <TrendingUp className="h-3 w-3" /> };

    const early = scores.slice(0, Math.floor(scores.length / 3));
    const late = scores.slice(-Math.floor(scores.length / 3));
    
    const earlyAvg = early.reduce((a, b) => a + b, 0) / early.length;
    const lateAvg = late.reduce((a, b) => a + b, 0) / late.length;

    if (lateAvg > earlyAvg + 0.5) {
      return { label: 'Peak late', icon: <TrendingUp className="h-3 w-3" /> };
    } else if (Math.abs(lateAvg - earlyAvg) < 0.3) {
      return { label: 'Even pacing', icon: <TrendingUp className="h-3 w-3" /> };
    } else {
      return { label: 'Strong start', icon: <TrendingUp className="h-3 w-3" /> };
    }
  };

  const formatRuntime = (minutes?: number): string => {
    if (!minutes) return '';
    
    switch (mediaType) {
      case 'game': {
        return `~${Math.round(minutes / 60)}h`;
      }
      case 'book':
      case 'manga': {
        return `${minutes} pages`;
      }
      default: {
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
      }
    }
  };

  const formatT2G = (pct?: number): string => {
    if (!pct || !runtime) return `${pct?.toFixed(0) || '?'}%`;
    
    const t2gMinutes = (pct / 100) * runtime;
    
    switch (mediaType) {
      case 'game': {
        const hours = Math.floor(t2gMinutes / 60);
        const mins = Math.round(t2gMinutes % 60);
        return `${pct.toFixed(0)}% (~${hours}h ${mins}m)`;
      }
      case 'book':
      case 'manga': {
        return `${pct.toFixed(0)}% (~page ${Math.round(t2gMinutes)})`;
      }
      default: {
        if (t2gMinutes < 60) return `${pct.toFixed(0)}% (~${Math.round(t2gMinutes)}m)`;
        const hrs = Math.floor(t2gMinutes / 60);
        const minutes = Math.round(t2gMinutes % 60);
        return `${pct.toFixed(0)}% (~${hrs}h ${minutes}m)`;
      }
    }
  };

  const pacingInsight = getPacingInsight();
  const userWiggCount = wiggsData?.entries?.length || 0;

  const handleCardClick = () => {
    if (onTitleClick) {
      onTitleClick();
    }
  };

  const handleLongPress = () => {
    setShowOverlay(true);
  };

  // Long press detection
  let pressTimer: NodeJS.Timeout;
  const handleTouchStart = () => {
    pressTimer = setTimeout(handleLongPress, 500);
  };

  const handleTouchEnd = () => {
    clearTimeout(pressTimer);
  };

  return (
    <>
      <Card 
        className={`group hover:shadow-md transition-all duration-200 cursor-pointer ${className}`}
        onClick={handleCardClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
      >
        <CardContent className="p-0">
          <div className="flex gap-3 p-3">
            {/* Cover Art */}
            <div className="flex-shrink-0">
              <div 
                className="w-16 h-24 bg-muted rounded border overflow-hidden group-hover:scale-105 transition-transform duration-200"
                style={{
                  backgroundImage: `url(${coverArt})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-2">
              {/* Title and Meta */}
              <div>
                <h3 className="font-semibold text-sm leading-tight truncate">
                  {title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  {year && <span>{year}</span>}
                  {runtime && <span>• {formatRuntime(runtime)}</span>}
                  {genre.length > 0 && <span>• {genre.slice(0, 2).join(', ')}</span>}
                </div>
              </div>

              {/* Pacing Barcode */}
              <div className="space-y-1">
                {isLoading ? (
                  <div className="h-6 bg-muted animate-pulse rounded" />
                ) : (
                  <PacingBarcode
                    titleId={titleId}
                    height={60}
                    segmentCount={Math.min(20, Math.max(12, Math.floor(window.innerWidth / 25)))}
                    segments={progressData?.segments || []}
                    t2gEstimatePct={wiggsData?.t2gEstimatePct}
                    dataScope="community"
                    className="rounded"
                  />
                )}
                
                {/* T2G Label */}
                {!isLoading && wiggsData?.t2gEstimatePct && (
                  <div className="flex items-center gap-1 text-xs">
                    <Star className="h-3 w-3 text-primary" fill="currentColor" />
                    <span className="text-muted-foreground">
                      Gets good {formatT2G(wiggsData.t2gEstimatePct)}
                    </span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  {pacingInsight.icon}
                  <span>{pacingInsight.label}</span>
                </div>
                <div className="text-muted-foreground">
                  {userWiggCount > 0 ? `${userWiggCount} moments logged` : 'No moments yet'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex-shrink-0 flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOverlay(true);
                }}
              >
                <Play className="h-4 w-4" />
              </Button>
              
              {mediaType && (
                <Badge variant="outline" className="text-xs">
                  {mediaType}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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
