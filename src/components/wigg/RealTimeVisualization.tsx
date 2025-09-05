import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { PacingBarcode } from "./PacingBarcode";
import { useTitleProgress } from "@/hooks/useTitleProgress";
import { useUserWiggs } from "@/hooks/useUserWiggs";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { type SwipeValue } from "./SwipeRating";
import { type SessionStats } from "./SessionRecap";

interface RealTimeVisualizationProps {
  titleId: string;
  sessionStats: SessionStats;
  currentRatings: SwipeValue[];
  variant?: "curve" | "bars" | "pulse" | "barcode"; // If not provided, uses user preference
  mediaType?: "movie" | "tv" | "anime" | "game" | "book" | "manga";
  runtime?: number; // in minutes for movies/tv, hours for games, pages for books/manga
  currentPosition?: number; // current position as a fraction (0-1) of total runtime/episodes
  onSeek?: (position: number) => void; // callback when user scrubs to a new position (0-1)
  onMarkWigg?: (pct: number) => void; // callback for marking a WIGG
}

export function RealTimeVisualization({ 
  titleId,
  sessionStats, 
  currentRatings, 
  variant,
  mediaType,
  runtime,
  currentPosition,
  onSeek,
  onMarkWigg
}: RealTimeVisualizationProps) {
  const isMobile = useIsMobile();
  const { data: progressData } = useTitleProgress(titleId);
  const { data: wiggsData } = useUserWiggs(titleId);
  const { preferences } = useUserPreferences();
  
  // Use user preference if variant is not explicitly provided
  const effectiveVariant = variant || preferences.graph_type;
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const position = Math.max(0, Math.min(1, x / rect.width));
    
    setHoverPosition(position);
    
    if (isDragging && onSeek) {
      onSeek(position);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !onSeek) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const position = Math.max(0, Math.min(1, x / rect.width));
    
    setIsDragging(true);
    onSeek(position);
    
    // Prevent text selection while dragging
    e.preventDefault();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setHoverPosition(null);
    setIsDragging(false);
  };

  // Add global mouse up listener when dragging
  React.useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseUp = () => setIsDragging(false);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [isDragging]);

  const getRatingColor = (rating: SwipeValue) => {
    switch (rating) {
      case 0: return "hsl(var(--muted))";
      case 1: return "hsl(30, 100%, 60%)"; // Orange
      case 2: return "hsl(210, 100%, 60%)"; // Blue  
      case 3: return "hsl(var(--primary))";
      default: return "hsl(var(--muted))";
    }
  };

  const getRatingLabel = (rating: SwipeValue) => {
    switch (rating) {
      case 0: return "zzz";
      case 1: return "good";
      case 2: return "better";
      case 3: return "peak";
      default: return "";
    }
  };

  const formatTimeMarker = (progress: number) => {
    if (!runtime) return '';
    
    const totalTime = progress * runtime;
    
    if (mediaType === "game") {
      // Games: show hours
      const hours = Math.floor(totalTime);
      const minutes = Math.round((totalTime % 1) * 60);
      if (hours === 0 && minutes === 0) return '0';
      if (minutes === 0) return `${hours}h`;
      return `${hours}h${minutes}m`;
    } else if (mediaType === "book" || mediaType === "manga") {
      // Books/manga: show pages
      return Math.round(totalTime).toString();
    } else {
      // Movies/TV: show minutes or hours:minutes
      const totalMinutes = Math.round(totalTime);
      if (totalMinutes < 60) return `${totalMinutes}m`;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return minutes === 0 ? `${hours}h` : `${hours}h${minutes}m`;
    }
  };

  const getAxisLabel = () => {
    if (mediaType === "book" || mediaType === "manga") return "pages";
    if (mediaType === "game") return "hours";
    return "time";
  };

  const renderCurveVisualization = () => {
    const height = 80; // Increased from 56 to make it taller
    // Use responsive width - full width on mobile, max 600px on larger screens
    const maxWidth = 600;

    if (currentRatings.length === 0) {
      // Show empty state with x-axis
      return (
        <div className="w-full px-4 py-6">
          <div className="w-full">
            <svg
            ref={svgRef}
            width="100%"
            height={height}
            viewBox={`0 0 ${maxWidth} ${height}`}
            className="overflow-visible border rounded-lg bg-background max-w-full cursor-pointer"
            preserveAspectRatio="xMidYMid meet"
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            {/* Grid lines - subtle like WIGG */}
            {[0.25, 0.5, 0.75].map((level) => (
              <line
                key={level}
                x1={0}
                x2={maxWidth}
                y1={height - 8 - level * (height - 16)}
                y2={height - 8 - level * (height - 16)}
                className="stroke-zinc-300/30"
                strokeWidth={1}
              />
            ))}

            {/* X-axis line */}
            <line
              x1={0}
              x2={maxWidth}
              y1={height - 8}
              y2={height - 8}
              className="stroke-zinc-300/50"
              strokeWidth={1}
            />

            {/* Mini bar at bottom - like WIGG */}
            <rect 
              x={0} 
              y={height - 3} 
              width={maxWidth} 
              height={2} 
              rx={1} 
              className="fill-current opacity-40" 
            />

            {/* Hover indicator - shows where user would seek to */}
            {hoverPosition !== null && onSeek && (
              <line
                x1={hoverPosition * maxWidth}
                x2={hoverPosition * maxWidth}
                y1={0}
                y2={height}
                stroke="currentColor"
                strokeWidth={1}
                strokeOpacity={0.4}
                className="stroke-primary"
                strokeDasharray="3,3"
              />
            )}

            {/* Playhead - vertical line showing current position */}
            {currentPosition !== undefined && currentPosition >= 0 && currentPosition <= 1 && (
              <motion.line
                x1={currentPosition * maxWidth}
                x2={currentPosition * maxWidth}
                y1={0}
                y2={height}
                stroke="currentColor"
                strokeWidth={2}
                strokeOpacity={0.8}
                className="stroke-primary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </svg>

          {/* Time markers */}
          {runtime && (
            <div className="relative mt-1 text-[10px] text-zinc-400 w-full">
              {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                
                return (
                  <span 
                    key={t} 
                    className="absolute"
                    style={{ 
                      left: `${t * 100}%`,
                      transform: t === 0 ? 'translateX(0)' : t === 1 ? 'translateX(-100%)' : 'translateX(-50%)'
                    }}
                  >
                    {formatTimeMarker(t)}
                  </span>
                );
              })}
            </div>
          )}
          </div>
        </div>
      );
    }

    const validRatings = currentRatings.filter(r => typeof r === 'number' && !isNaN(r));
    
    if (validRatings.length === 0) {
      return (
        <div className="w-full px-4 py-6">
          <div className="w-full h-16 border rounded-lg flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Invalid rating data</span>
          </div>
        </div>
      );
    }

    // Scale functions similar to WIGG
    const y = (v: number) => height - 8 - v * (height - 16) / 3;
    const x = (index: number) => validRatings.length === 1 ? maxWidth / 2 : (index / (validRatings.length - 1)) * maxWidth;

    const pointsData = validRatings.map((rating, index) => ({
      x: x(index),
      y: y(rating),
      rating,
      originalIndex: index
    }));

    // Create area path similar to WIGG
    const areaPath = (() => {
      if (!pointsData.length) return '';
      let d = `M 0 ${y(0)} `;
      d += `L ${pointsData[0].x} ${pointsData[0].y} `;
      for (let i = 1; i < pointsData.length; i++) {
        d += `L ${pointsData[i].x} ${pointsData[i].y} `;
      }
      d += `L ${maxWidth} ${y(0)} Z`;
      return d;
    })();

    // Find peaks for circles
    const peaks = pointsData.filter((point, i) => {
      if (pointsData.length === 1) return true;
      const prev = pointsData[i - 1];
      const next = pointsData[i + 1];
      
      // Peak if higher than neighbors or at ends
      return !prev || !next || 
        (point.rating >= (prev?.rating || 0) && point.rating >= (next?.rating || 0)) ||
        point.rating >= 2; // Always show "better" and "peak" ratings
    });

    return (
      <div className="w-full px-4 py-6">
        <div className="w-full">
          <svg
          ref={svgRef}
          width="100%"
          height={height}
          viewBox={`0 0 ${maxWidth} ${height}`}
          className="overflow-visible border rounded-lg bg-background max-w-full cursor-pointer"
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {/* Grid lines - subtle like WIGG */}
          {[0.25, 0.5, 0.75].map((level) => (
            <line
              key={level}
              x1={0}
              x2={maxWidth}
              y1={y(level * 3)}
              y2={y(level * 3)}
              className="stroke-zinc-300/30"
              strokeWidth={1}
            />
          ))}

          {/* Area fill - similar to WIGG */}
          <motion.path
            d={areaPath}
            className="fill-current"
            fillOpacity={0.25}
            stroke="currentColor"
            strokeWidth={1}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />

          {/* Peak circles - similar to WIGG */}
          {peaks.map((peak, i) => (
            <motion.circle
              key={peak.originalIndex}
              cx={peak.x}
              cy={peak.y}
              r={4}
              className="fill-current"
              fillOpacity={0.8}
              stroke="currentColor"
              strokeWidth={1}
              strokeOpacity={0.6}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 }}
            />
          ))}

          {/* Mini bar at bottom - like WIGG */}
          <rect 
            x={0} 
            y={height - 3} 
            width={maxWidth} 
            height={2} 
            rx={1} 
            className="fill-current opacity-40" 
          />

          {/* Hover indicator - shows where user would seek to */}
          {hoverPosition !== null && onSeek && (
            <line
              x1={hoverPosition * maxWidth}
              x2={hoverPosition * maxWidth}
              y1={0}
              y2={height}
              stroke="currentColor"
              strokeWidth={1}
              strokeOpacity={0.4}
              className="stroke-primary"
              strokeDasharray="3,3"
            />
          )}

          {/* Playhead - vertical line showing current position */}
          {currentPosition !== undefined && currentPosition >= 0 && currentPosition <= 1 && (
            <motion.line
              x1={currentPosition * maxWidth}
              x2={currentPosition * maxWidth}
              y1={0}
              y2={height}
              stroke="currentColor"
              strokeWidth={2}
              strokeOpacity={0.8}
              className="stroke-primary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </svg>

        {/* Time markers - similar to WIGG */}
        <div className="relative mt-1 text-[10px] text-zinc-400 w-full">
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            // Use runtime-based markers if available, otherwise fall back to episode numbers
            const marker = runtime 
              ? formatTimeMarker(t)
              : validRatings.length === 1 ? '1' : (Math.round(t * (validRatings.length - 1)) + 1).toString();
            
            return (
              <span 
                key={t} 
                className="absolute"
                style={{ 
                  left: `${t * 100}%`,
                  transform: t === 0 ? 'translateX(0)' : t === 1 ? 'translateX(-100%)' : 'translateX(-50%)'
                }}
              >
                {marker}
              </span>
            );
          })}
        </div>
        </div>
      </div>
    );
  };

  const renderBarsVisualization = () => {
    const maxCount = Math.max(sessionStats.skip, sessionStats.ok, sessionStats.good, sessionStats.peak);
    if (maxCount === 0) return null;

    const bars = [
      { label: "zzz", count: sessionStats.skip, color: getRatingColor(0) },
      { label: "good", count: sessionStats.ok, color: getRatingColor(1) },
      { label: "better", count: sessionStats.good, color: getRatingColor(2) },
      { label: "peak", count: sessionStats.peak, color: getRatingColor(3) },
    ];

    return (
      <div className="w-full h-20 bg-gradient-to-r from-background to-muted rounded-lg border p-2">
        <div className="flex items-end justify-between h-full gap-1">
          {bars.map((bar, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <motion.div
                className="w-full rounded-t"
                style={{ 
                  backgroundColor: bar.color,
                  height: `${(bar.count / maxCount) * 100}%`,
                  minHeight: bar.count > 0 ? "8px" : "0px"
                }}
                initial={{ height: 0 }}
                animate={{ height: `${(bar.count / maxCount) * 100}%` }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              />
              <span className="text-xs mt-1 text-muted-foreground">{bar.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPulseVisualization = () => {
    const totalRatings = sessionStats.n;
    if (totalRatings === 0) return null;

    const average = (sessionStats.skip * 0 + sessionStats.ok * 1 + sessionStats.good * 2 + sessionStats.peak * 3) / totalRatings;
    
    return (
      <div className="relative w-full h-20 bg-gradient-to-r from-background to-muted rounded-lg border overflow-hidden">
        <motion.div
          className="absolute inset-0 rounded-lg"
          style={{
            background: `radial-gradient(circle at center, ${getRatingColor(Math.round(average) as SwipeValue)} 0%, transparent 70%)`
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: getRatingColor(Math.round(average) as SwipeValue) }}>
              {average.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">Average Rating</div>
          </div>
        </div>
        
        <div className="absolute top-2 right-2">
          <Badge variant="outline">
            {totalRatings} rated
          </Badge>
        </div>
      </div>
    );
  };

  const renderBarcodeVisualization = () => {
    // Convert SwipeValue ratings to segments for barcode
    const segments = currentRatings.map((rating, index) => ({
      startPct: (index / currentRatings.length) * 100,
      endPct: ((index + 1) / currentRatings.length) * 100,
      userScore: rating,
      meanScore: undefined // Use user score for real-time visualization
    }));

    // Use fallback segments if no current ratings
    const displaySegments = segments.length > 0 ? segments : (progressData?.segments || []);

    return (
      <div className="w-full px-4 py-6">
        <PacingBarcode
          titleId={titleId}
          height={isMobile ? 48 : 56}
          segmentCount={isMobile ? 
            Math.min(25, Math.max(15, Math.floor(window.innerWidth / 20))) : 
            Math.min(35, Math.max(20, Math.floor(window.innerWidth / 15)))
          }
          segments={displaySegments}
          t2gEstimatePct={wiggsData?.t2gEstimatePct}
          currentPct={currentPosition ? currentPosition * 100 : undefined}
          onScrub={onSeek ? (pct) => onSeek(pct / 100) : undefined}
          onCommitScrub={onSeek ? (pct) => onSeek(pct / 100) : undefined}
          onMarkWigg={onMarkWigg}
          interactive={Boolean(onSeek || onMarkWigg)}
          ariaLabel={`Real-time progress visualization for ${mediaType || 'media'}`}
          className="border-2 border-primary/20"
        />
        
        {/* Progress info */}
        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
          <div>
            {displaySegments.length} segments • {sessionStats.n} rated
          </div>
          {wiggsData?.t2gEstimatePct && (
            <div className="flex items-center gap-1">
              ⭐ Gets good: {wiggsData.t2gEstimatePct.toFixed(0)}%
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-center mt-2 text-xs text-muted-foreground">
          {isMobile ? 'Tap to scrub • Long press to mark WIGG' : 'Click to scrub • Long press to mark WIGG'}
        </div>
      </div>
    );
  };

  // Use barcode on mobile for all media types, or when explicitly requested
  const shouldUseBarcode = isMobile || effectiveVariant === "barcode";

  if (shouldUseBarcode) {
    return renderBarcodeVisualization();
  }

  switch (effectiveVariant) {
    case "curve": return renderCurveVisualization();
    case "bars": return renderBarsVisualization();
    case "pulse": return renderPulseVisualization();
    case "barcode": return renderBarcodeVisualization();
    default: return renderCurveVisualization();
  }
}