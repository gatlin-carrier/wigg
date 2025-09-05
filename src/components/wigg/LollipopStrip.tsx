import React, { useMemo } from 'react';
import { type ProgressSegment } from '@/hooks/useTitleProgress';
import { Star } from 'lucide-react';

export interface LollipopStripProps {
  titleId: string;
  segments: ProgressSegment[];
  t2gEstimatePct?: number;
  threshold?: number; // Score threshold for T2G marking
  onMarkWigg?: (pct: number) => void;
  interactive?: boolean;
  className?: string;
  height?: number;
}

export function LollipopStrip({
  titleId,
  segments,
  t2gEstimatePct,
  threshold = 2, // Default to "better" rating as threshold
  onMarkWigg,
  interactive = false,
  className = '',
  height = 60
}: LollipopStripProps) {
  const beadData = useMemo(() => {
    if (segments.length === 0) return [];

    return segments.map((segment, index) => {
      const score = segment.userScore !== undefined ? segment.userScore : segment.meanScore;
      const pct = (segment.startPct + segment.endPct) / 2; // Center of segment
      
      // Calculate bead properties based on score
      const normalizedScore = score ? Math.max(0, Math.min(4, score)) : 0;
      const radius = Math.max(3, Math.min(12, (normalizedScore / 4) * 12 + 3)); // 3-15px radius
      const opacity = Math.max(0.2, Math.min(1, normalizedScore / 4));
      
      // Check if this is the first bead exceeding threshold for T2G
      const isT2G = score && score >= threshold && 
        !segments.slice(0, index).some(s => {
          const prevScore = s.userScore !== undefined ? s.userScore : s.meanScore;
          return prevScore && prevScore >= threshold;
        });

      return {
        id: `bead-${index}`,
        pct,
        score: normalizedScore,
        radius,
        opacity,
        isT2G,
        segment
      };
    });
  }, [segments, threshold]);

  // Check if beads would be too close together (< 12px apart)
  const needsScrolling = useMemo(() => {
    if (beadData.length < 2) return false;
    
    const containerWidth = Math.min(600, window.innerWidth - 32); // Max width minus padding
    const minSpacing = 24; // Minimum 24px between centers (12px radius * 2)
    const requiredWidth = (beadData.length - 1) * minSpacing + 24; // Plus padding
    
    return requiredWidth > containerWidth;
  }, [beadData]);

  const handleBeadClick = (bead: typeof beadData[0]) => {
    if (!interactive || !onMarkWigg) return;
    onMarkWigg(bead.pct);
  };

  const handleBeadKeyDown = (e: React.KeyboardEvent, bead: typeof beadData[0]) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleBeadClick(bead);
    }
  };

  if (beadData.length === 0) {
    return (
      <div className={`w-full ${className}`}>
        <div className="flex items-center justify-center h-16 border rounded-lg bg-muted/20">
          <span className="text-sm text-muted-foreground">No data available</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div 
        className={`relative ${needsScrolling ? 'overflow-x-auto' : 'overflow-hidden'}`}
        style={{ 
          scrollSnapType: needsScrolling ? 'x mandatory' : undefined,
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div 
          className="flex items-center justify-center p-4"
          style={{
            minWidth: needsScrolling ? `${beadData.length * 24 + 48}px` : '100%',
            height: `${height}px`
          }}
        >
          {/* Connecting line */}
          <div 
            className="absolute bg-muted-foreground/30 rounded-full"
            style={{
              height: '2px',
              left: needsScrolling ? '32px' : '10%',
              right: needsScrolling ? '32px' : '10%',
              top: '50%',
              transform: 'translateY(-50%)'
            }}
          />

          {/* Beads */}
          {beadData.map((bead, index) => {
            const leftPosition = needsScrolling 
              ? `${24 + index * 24}px`
              : `${10 + (index / (beadData.length - 1)) * 80}%`;

            return (
              <div
                key={bead.id}
                className="absolute"
                style={{
                  left: leftPosition,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  scrollSnapAlign: needsScrolling ? 'center' : undefined
                }}
              >
                {/* Main bead */}
                <div
                  className={`rounded-full border-2 border-background transition-all duration-200 ${
                    interactive ? 'cursor-pointer hover:scale-110' : ''
                  } ${bead.score > 0 ? 'shadow-sm' : ''}`}
                  style={{
                    width: `${bead.radius * 2}px`,
                    height: `${bead.radius * 2}px`,
                    backgroundColor: `hsl(var(--primary) / ${bead.opacity})`,
                    borderWidth: bead.score === 0 ? '1px' : '2px'
                  }}
                  onClick={() => handleBeadClick(bead)}
                  onKeyDown={(e) => handleBeadKeyDown(e, bead)}
                  role={interactive ? 'button' : undefined}
                  tabIndex={interactive ? 0 : -1}
                  aria-label={interactive ? 
                    `Mark WIGG at ${bead.pct.toFixed(1)}% (score: ${bead.score.toFixed(1)}/4)` :
                    `Score: ${bead.score.toFixed(1)}/4 at ${bead.pct.toFixed(1)}%`
                  }
                  aria-pressed={interactive && bead.segment.userScore !== undefined ? 'true' : 'false'}
                />

                {/* T2G Star overlay */}
                {bead.isT2G && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{ 
                      fontSize: `${Math.min(bead.radius, 8)}px`,
                    }}
                  >
                    <Star 
                      className="text-primary drop-shadow-sm" 
                      size={Math.min(bead.radius * 1.2, 10)}
                      fill="currentColor"
                    />
                  </div>
                )}

                {/* Percentage label (shown on hover or for key beads) */}
                {(bead.isT2G || bead.score >= 3) && (
                  <div 
                    className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2"
                    style={{ fontSize: '9px' }}
                  >
                    <span className="text-muted-foreground whitespace-nowrap">
                      {bead.pct.toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {/* T2G Estimate marker (if different from first threshold bead) */}
          {t2gEstimatePct !== undefined && !beadData.some(b => b.isT2G && Math.abs(b.pct - t2gEstimatePct) < 2) && (
            <div
              className="absolute"
              style={{
                left: needsScrolling 
                  ? `${24 + (t2gEstimatePct / 100) * (beadData.length - 1) * 24}px`
                  : `${10 + (t2gEstimatePct / 100) * 80}%`,
                top: '20%',
                transform: 'translate(-50%, 0)'
              }}
            >
              <Star 
                className="text-primary drop-shadow-md animate-pulse" 
                size={12}
                fill="currentColor"
              />
              <div 
                className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 text-xs font-medium text-primary whitespace-nowrap"
              >
                T2G: {t2gEstimatePct.toFixed(0)}%
              </div>
            </div>
          )}
        </div>

        {/* Scroll hint for mobile */}
        {needsScrolling && (
          <div className="text-xs text-center text-muted-foreground pb-2">
            Scroll horizontally to explore →
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div 
            className="w-3 h-3 rounded-full border"
            style={{ backgroundColor: 'hsl(var(--primary) / 0.3)' }}
          />
          <span>Okay</span>
        </div>
        <div className="flex items-center gap-1">
          <div 
            className="w-4 h-4 rounded-full border-2"
            style={{ backgroundColor: 'hsl(var(--primary) / 0.7)' }}
          />
          <span>Good</span>
        </div>
        <div className="flex items-center gap-1">
          <div 
            className="w-5 h-5 rounded-full border-2"
            style={{ backgroundColor: 'hsl(var(--primary))' }}
          />
          <span>Great</span>
        </div>
        {beadData.some(b => b.isT2G) && (
          <div className="flex items-center gap-1">
            <Star size={12} className="text-primary" fill="currentColor" />
            <span>Time-to-Good</span>
          </div>
        )}
      </div>

      {/* Screen reader summary */}
      <div className="sr-only">
        Lollipop strip visualization showing {beadData.length} data points for {titleId}.
        {t2gEstimatePct && ` Estimated time-to-good: ${t2gEstimatePct.toFixed(0)}%`}
        {beadData.filter(b => b.score >= 3).length > 0 && 
          ` ${beadData.filter(b => b.score >= 3).length} segments with high scores.`
        }
        {interactive && ' Press Enter or Space on any bead to mark a WIGG at that point.'}
      </div>
    </div>
  );
}