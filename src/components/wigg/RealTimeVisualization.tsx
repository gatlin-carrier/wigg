import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { type SwipeValue } from "./SwipeRating";
import { type SessionStats } from "./SessionRecap";

interface RealTimeVisualizationProps {
  sessionStats: SessionStats;
  currentRatings: SwipeValue[];
  variant?: "curve" | "bars" | "pulse";
}

export function RealTimeVisualization({ 
  sessionStats, 
  currentRatings, 
  variant = "curve" 
}: RealTimeVisualizationProps) {
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
      case 0: return "Filler";
      case 1: return "Warming Up";
      case 2: return "Getting Good";
      case 3: return "Peak";
      default: return "";
    }
  };

  const renderCurveVisualization = () => {
    if (currentRatings.length === 0) {
      return (
        <div className="w-full h-20 bg-gradient-to-r from-background to-muted rounded-lg border flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Start rating to see your curve</span>
        </div>
      );
    }

    const maxHeight = 60;
    const validRatings = currentRatings.filter(r => typeof r === 'number' && !isNaN(r));
    
    if (validRatings.length === 0) {
      return (
        <div className="w-full h-20 bg-gradient-to-r from-background to-muted rounded-lg border flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Invalid rating data</span>
        </div>
      );
    }

    const pointsData = validRatings.map((rating, index) => {
      const x = validRatings.length === 1 ? 50 : (index / (validRatings.length - 1)) * 100;
      const y = maxHeight - (rating / 3) * maxHeight;
      
      // Only return point if both x and y are valid numbers
      if (isNaN(x) || isNaN(y) || !isFinite(x) || !isFinite(y)) {
        return null;
      }
      
      return { x, y, rating, originalIndex: index };
    }).filter(point => point !== null);

    const pathPoints = pointsData.map(point => `${point.x},${point.y}`);
    
    const pathD = pathPoints.length > 1 
      ? `M${pathPoints.join(' L')}`
      : pathPoints.length === 1 
      ? `M${pathPoints[0]} L${pathPoints[0]}`
      : "M0,30 L0,30";

    return (
      <div className="relative w-full h-20 bg-gradient-to-r from-background to-muted rounded-lg border overflow-hidden">
        <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full">
          {/* Grid lines */}
          {[0, 1, 2, 3].map(level => (
            <line
              key={level}
              x1="0"
              y1={maxHeight - (level / 3) * maxHeight}
              x2="100"
              y2={maxHeight - (level / 3) * maxHeight}
              stroke="hsl(var(--muted))"
              strokeWidth="0.5"
              opacity="0.3"
            />
          ))}
          
          {/* Rating curve */}
          <motion.path
            d={pathD}
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
          
          {/* Rating points */}
          {pointsData.map((point, index) => (
            <motion.circle
              key={point.originalIndex}
              cx={point.x}
              cy={point.y}
              r="2"
              fill={getRatingColor(point.rating)}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
            />
          ))}
        </svg>
        
        {/* Latest rating indicator */}
        {currentRatings.length > 0 && (
          <div className="absolute top-2 right-2">
            <Badge 
              variant="outline" 
              style={{ 
                backgroundColor: getRatingColor(currentRatings[currentRatings.length - 1]),
                color: "white" 
              }}
            >
              {getRatingLabel(currentRatings[currentRatings.length - 1])}
            </Badge>
          </div>
        )}
      </div>
    );
  };

  const renderBarsVisualization = () => {
    const maxCount = Math.max(sessionStats.skip, sessionStats.ok, sessionStats.good, sessionStats.peak);
    if (maxCount === 0) return null;

    const bars = [
      { label: "Filler", count: sessionStats.skip, color: getRatingColor(0) },
      { label: "Warming", count: sessionStats.ok, color: getRatingColor(1) },
      { label: "Good", count: sessionStats.good, color: getRatingColor(2) },
      { label: "Peak", count: sessionStats.peak, color: getRatingColor(3) },
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

  switch (variant) {
    case "curve": return renderCurveVisualization();
    case "bars": return renderBarsVisualization();
    case "pulse": return renderPulseVisualization();
    default: return renderCurveVisualization();
  }
}