import React, { useMemo } from 'react';
import { type Milestone } from '@/hooks/useMilestones';

export interface MilestonePathProps {
  titleId: string;
  milestones: Milestone[];
  segmentScores?: Array<{ pct: number; score: number }>;
  onSelect?: (milestoneId: string) => void;
  focusPct?: number;
  className?: string;
  height?: number;
  maxWidth?: number;
}

export function MilestonePath({
  titleId,
  milestones,
  segmentScores = [],
  onSelect,
  focusPct,
  className = '',
  height = 120,
  maxWidth = 800
}: MilestonePathProps) {
  // Calculate path coordinates and collision avoidance
  const pathData = useMemo(() => {
    if (milestones.length === 0) return null;

    const padding = 40;
    const contentWidth = maxWidth - (padding * 2);
    const contentHeight = height - 60; // Leave space for labels
    const baseY = contentHeight * 0.7;

    // Sort milestones by percentage
    const sortedMilestones = [...milestones].sort((a, b) => a.pct - b.pct);

    // Calculate positions with collision avoidance
    const positions = sortedMilestones.map((milestone, index) => {
      const x = padding + (milestone.pct / 100) * contentWidth;
      
      // Apply y-jitter for collision avoidance
      let y = baseY;
      const jitterRange = 30;
      
      // Check for nearby milestones and apply vertical offset
      const nearby = sortedMilestones.filter((other, otherIndex) => 
        otherIndex !== index && 
        Math.abs(other.pct - milestone.pct) < 15 // Within 15% range
      );
      
      if (nearby.length > 0) {
        const offset = (index % 3 - 1) * (jitterRange / 2);
        y += offset;
      }

      return {
        ...milestone,
        x,
        y: Math.max(20, Math.min(contentHeight - 20, y))
      };
    });

    // Create smooth path curve
    const createPath = () => {
      if (positions.length === 0) return '';
      
      let path = `M ${padding} ${baseY}`;
      
      if (positions.length === 1) {
        path += ` L ${positions[0].x} ${positions[0].y}`;
        path += ` L ${maxWidth - padding} ${baseY}`;
      } else {
        // Create smooth curve through all points
        positions.forEach((pos, index) => {
          if (index === 0) {
            path += ` L ${pos.x} ${pos.y}`;
          } else {
            const prevPos = positions[index - 1];
            const controlDistance = Math.min(50, (pos.x - prevPos.x) * 0.3);
            
            path += ` C ${prevPos.x + controlDistance} ${prevPos.y}, ${pos.x - controlDistance} ${pos.y}, ${pos.x} ${pos.y}`;
          }
        });
        
        // Complete the path
        const lastPos = positions[positions.length - 1];
        path += ` C ${lastPos.x + 30} ${lastPos.y}, ${maxWidth - padding - 30} ${baseY}, ${maxWidth - padding} ${baseY}`;
      }

      return path;
    };

    return {
      path: createPath(),
      positions,
      baseY
    };
  }, [milestones, height, maxWidth]);

  // Interpolate color based on segment scores
  const getPathColor = (pct: number): string => {
    if (segmentScores.length === 0) return 'hsl(var(--primary))';

    // Find closest score points
    const sorted = segmentScores.sort((a, b) => a.pct - b.pct);
    const lower = sorted.filter(s => s.pct <= pct).pop();
    const upper = sorted.find(s => s.pct > pct);

    let score = lower?.score || 2; // Default neutral
    
    if (lower && upper) {
      // Interpolate between points
      const ratio = (pct - lower.pct) / (upper.pct - lower.pct);
      score = lower.score + (upper.score - lower.score) * ratio;
    }

    // Map score (0-4) to color intensity
    const intensity = Math.max(0.3, Math.min(1, score / 4));
    return `hsl(var(--primary) / ${intensity})`;
  };

  const createGradient = () => {
    if (segmentScores.length === 0) return null;

    const gradientStops = [];
    for (let i = 0; i <= 10; i++) {
      const pct = (i / 10) * 100;
      const color = getPathColor(pct);
      gradientStops.push(
        <stop
          key={i}
          offset={`${i * 10}%`}
          stopColor={color}
        />
      );
    }

    return (
      <defs>
        <linearGradient id={`milestone-gradient-${titleId}`} x1="0%" y1="0%" x2="100%" y2="0%">
          {gradientStops}
        </linearGradient>
      </defs>
    );
  };

  if (!pathData || milestones.length === 0) {
    return (
      <div className={`w-full ${className}`}>
        <div className="flex items-center justify-center h-24 border rounded-lg bg-muted/20">
          <span className="text-sm text-muted-foreground">No milestones available</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${maxWidth} ${height}`}
        className="overflow-visible"
        preserveAspectRatio="xMidYMid meet"
      >
        {createGradient()}
        
        {/* Main path */}
        <path
          d={pathData.path}
          fill="none"
          stroke={segmentScores.length > 0 ? `url(#milestone-gradient-${titleId})` : 'hsl(var(--primary))'}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-sm"
        />

        {/* Focus cursor */}
        {focusPct !== undefined && focusPct >= 0 && focusPct <= 100 && (
          <circle
            cx={40 + (focusPct / 100) * (maxWidth - 80)}
            cy={pathData.baseY}
            r={6}
            fill="hsl(var(--primary))"
            stroke="white"
            strokeWidth={2}
            className="animate-pulse drop-shadow-md"
          />
        )}

        {/* Milestone stops */}
        {pathData.positions.map((milestone) => (
          <g key={milestone.id}>
            {/* Milestone circle */}
            <circle
              cx={milestone.x}
              cy={milestone.y}
              r={16}
              fill="white"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              className="drop-shadow-md cursor-pointer hover:stroke-[3px] transition-all"
              onClick={() => onSelect?.(milestone.id)}
            />
            
            {/* Milestone icon/emoji */}
            <text
              x={milestone.x}
              y={milestone.y + 5}
              textAnchor="middle"
              fontSize="12"
              className="pointer-events-none select-none"
            >
              {milestone.icon || '•'}
            </text>

            {/* Milestone label */}
            <text
              x={milestone.x}
              y={milestone.y - 28}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              className="fill-foreground pointer-events-none select-none"
              style={{
                textShadow: '0 1px 2px rgba(255,255,255,0.8)'
              }}
            >
              {milestone.label}
            </text>

            {/* Percentage label */}
            <text
              x={milestone.x}
              y={milestone.y + 35}
              textAnchor="middle"
              fontSize="9"
              className="fill-muted-foreground pointer-events-none select-none"
            >
              {milestone.pct.toFixed(0)}%
            </text>

            {/* Invisible click area for better touch targets */}
            <circle
              cx={milestone.x}
              cy={milestone.y}
              r={22}
              fill="transparent"
              className="cursor-pointer"
              onClick={() => onSelect?.(milestone.id)}
              role="button"
              aria-label={`${milestone.label} at ${milestone.pct.toFixed(0)}%`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect?.(milestone.id);
                }
              }}
            />
          </g>
        ))}

        {/* Progress markers at 25% intervals */}
        {[25, 50, 75].map((pct) => (
          <line
            key={pct}
            x1={40 + (pct / 100) * (maxWidth - 80)}
            y1={pathData.baseY - 10}
            x2={40 + (pct / 100) * (maxWidth - 80)}
            y2={pathData.baseY + 10}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={1}
            opacity={0.3}
          />
        ))}
      </svg>

      {/* Accessible milestone list for screen readers */}
      <div className="sr-only">
        <h3>Narrative milestones for {titleId}</h3>
        <ul>
          {milestones.map((milestone) => (
            <li key={milestone.id}>
              {milestone.label} at {milestone.pct.toFixed(0)}%
              {milestone.icon && ` (${milestone.icon})`}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}