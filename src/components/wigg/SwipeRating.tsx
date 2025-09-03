import React, { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export type SwipeValue = 0 | 1 | 2 | 3;
export type SwipeDirection = "left" | "right" | "up" | "down";

export type Unit = {
  id: string;
  title: string;
  ordinal: number;
  subtype: "episode" | "chapter" | "issue";
  runtimeSec?: number;
  pages?: number;
};

interface SwipeRatingProps {
  unit: Unit;
  onSwiped: (direction: SwipeDirection, value: SwipeValue) => void;
  className?: string;
}

function classNames(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

export function SwipeRating({ unit, onSwiped, className = "" }: SwipeRatingProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-12, 0, 12]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = (_: any, info: any) => {
    const dx = info.offset.x;
    const dy = info.offset.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const threshold = 100;

    let direction: SwipeDirection | null = null;
    if (absX > absY && absX > threshold) {
      direction = dx > 0 ? "right" : "left";
    } else if (absY > threshold) {
      direction = dy > 0 ? "down" : "up";
    }

    if (direction) {
      const valueMap: Record<SwipeDirection, SwipeValue> = {
        left: 0,   // Skip
        up: 1,     // Okay
        right: 2,  // Good
        down: 3,   // Peak
      };
      onSwiped(direction, valueMap[direction]);
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    // Prevent handling if user is typing in an input
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    const keyMap: Record<string, SwipeDirection> = {
      // Arrow keys
      'ArrowLeft': 'left',    // Skip
      'ArrowUp': 'up',        // Okay  
      'ArrowRight': 'right',  // Good
      'ArrowDown': 'down',    // Peak
      
      // ASDF keys (same mapping)
      'KeyA': 'left',         // Skip
      'KeyS': 'up',           // Okay
      'KeyD': 'right',        // Good
      'KeyF': 'down',         // Peak
    };

    const direction = keyMap[event.code];
    if (direction) {
      event.preventDefault();
      const valueMap: Record<SwipeDirection, SwipeValue> = {
        left: 0,   // Skip
        up: 1,     // Okay
        right: 2,  // Good
        down: 3,   // Peak
      };
      onSwiped(direction, valueMap[direction]);
    }
  };

  useEffect(() => {
    // Focus the container to enable keyboard events
    if (containerRef.current) {
      containerRef.current.focus();
    }

    // Add global keyboard listener
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <motion.div
      ref={containerRef}
      className={classNames(
        "relative w-full h-72 rounded-2xl border border-border shadow-sm select-none",
        "bg-card overflow-hidden flex focus:outline-none focus:ring-2 focus:ring-ring",
        className
      )}
      style={{ x, y, rotate }}
      drag
      dragElastic={0.2}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      tabIndex={0}
    >
      <div className="p-4 w-full grid grid-rows-[auto_1fr_auto]">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {unit.subtype.toUpperCase()} {unit.ordinal}
          </Badge>
          <div className="text-muted-foreground text-xs flex items-center gap-2">
            {unit.runtimeSec ? (
              <span>Runtime {Math.round(unit.runtimeSec / 60)} min</span>
            ) : unit.pages ? (
              <span>{unit.pages} pages</span>
            ) : null}
          </div>
        </div>
        
        <div className="flex items-center justify-center text-center px-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">{unit.title}</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Swipe or use keyboard shortcuts
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>Arrows: ← ↑ → ↓</div>
              <div>Keys: A S D F</div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs px-2 opacity-80">
          <div className="text-center">
            <div>← A</div>
            <div>Skip</div>
          </div>
          <div className="text-center">
            <div>↑ S</div>
            <div>Okay</div>
          </div>
          <div className="text-center">
            <div>→ D</div>
            <div>Good</div>
          </div>
          <div className="text-center">
            <div>↓ F</div>
            <div>Peak</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}