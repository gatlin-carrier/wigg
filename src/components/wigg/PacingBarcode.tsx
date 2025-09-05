import React, { useRef, useEffect, useState, useCallback, useMemo, memo } from 'react';
import { type ProgressSegment } from '@/hooks/useTitleProgress';

// Performance monitoring
interface PerformanceMetrics {
  renderTime: number;
  interactionLatency: number;
  memoryUsage: number;
}

// Debounce hook for performance
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttle hook for high-frequency events
function useThrottle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): T {
  const [isThrottled, setIsThrottled] = useState(false);

  return useCallback(
    ((...args) => {
      if (!isThrottled) {
        fn(...args);
        setIsThrottled(true);
        setTimeout(() => setIsThrottled(false), delay);
      }
    }) as T,
    [fn, delay, isThrottled]
  );
}

// Edit Graph Mode state machine
export type EditGraphState = 'idle' | 'edit_enabled' | 'placing' | 'preview_zoom' | 'committed' | 'canceled';

export interface WiggPuckState {
  pct: number;
  isDragging: boolean;
  showFisheye: boolean;
  fisheyeZoom: number; // 2-3x magnification
}

export interface PacingBarcodeProps {
  titleId: string;
  height?: number;
  segmentCount?: number;
  segments: ProgressSegment[];
  t2gEstimatePct?: number;
  currentPct?: number;
  onScrub?: (pct: number) => void;
  onCommitScrub?: (pct: number) => void;
  onMarkWigg?: (pct: number) => void;
  interactive?: boolean;
  ariaLabel?: string;
  className?: string;
  
  // Edit Graph Mode props
  editable?: boolean;
  onEnterEdit?: () => void;
  onExitEdit?: () => void;
  onPlaceWigg?: (pct: number, note?: string) => Promise<void>;
  onPaintSegmentScore?: (pct: number, score: number) => Promise<void>;
  showFisheye?: boolean;
  editIdleTimeoutMs?: number; // Auto-exit after idle (default 10s)
}

export const PacingBarcode = memo(function PacingBarcode({
  titleId,
  height = 32,
  segmentCount = 20,
  segments,
  t2gEstimatePct,
  currentPct,
  onScrub,
  onCommitScrub,
  onMarkWigg,
  interactive = false,
  ariaLabel,
  className = '',
  
  // Edit Graph Mode props
  editable = false,
  onEnterEdit,
  onExitEdit,
  onPlaceWigg,
  onPaintSegmentScore,
  showFisheye = true,
  editIdleTimeoutMs = 10000
}: PacingBarcodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null); // For puck and fisheye
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Performance monitoring
  const performanceMetrics = useRef<PerformanceMetrics>({
    renderTime: 0,
    interactionLatency: 0,
    memoryUsage: 0
  });
  
  // Error boundary state
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Existing state
  const [isDragging, setIsDragging] = useState(false);
  const [currentScrubPct, setCurrentScrubPct] = useState<number | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(0);
  
  // Edit Graph Mode state
  const [editState, setEditState] = useState<EditGraphState>('idle');
  const [puckState, setPuckState] = useState<WiggPuckState | null>(null);
  const [editIdleTimer, setEditIdleTimer] = useState<NodeJS.Timeout | null>(null);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [paintStroke, setPaintStroke] = useState<Array<{ pct: number; score: number }>>([]);
  const [undoStack, setUndoStack] = useState<Array<{ id: string; pct: number; action: 'place' | 'paint' }>>([]);
  const [showCoachmark, setShowCoachmark] = useState(false);
  const [isPaintMode, setIsPaintMode] = useState(false);
  const [paintStartY, setPaintStartY] = useState<number | null>(null);

  // Clamp segment count (memoized)
  const clampedSegmentCount = useMemo(() => 
    Math.max(12, Math.min(40, segmentCount))
  , [segmentCount]);
  
  // Debounced paint buffer for smooth painting
  const [paintBuffer, setPaintBuffer] = useState<number[]>([]);
  const debouncedPaintBuffer = useDebounce(paintBuffer, 50); // 50ms debounce

  // Normalize scores to 0-1 range
  const normalizeScore = useCallback((score: number | undefined): number => {
    if (score === undefined) return 0.2; // Default neutral opacity
    return Math.max(0.1, Math.min(1, score / 4)); // Assuming 4 is max score
  }, []);

  // Snap to nearest segment center
  const snapToSegment = useCallback((pct: number): number => {
    const segmentWidth = 100 / clampedSegmentCount;
    const segmentIndex = Math.round(pct * clampedSegmentCount / 100);
    return Math.max(0, Math.min(100, (segmentIndex * segmentWidth) + (segmentWidth / 2)));
  }, [clampedSegmentCount]);

  // Edit Graph Mode state management
  const enterEditMode = useCallback(() => {
    if (!editable || editState !== 'idle') return;
    
    setEditState('edit_enabled');
    onEnterEdit?.();
    
    // Show coachmark for first-time users (check localStorage)
    const hasSeenCoachmark = localStorage.getItem(`wigg-coachmark-${titleId}`);
    if (!hasSeenCoachmark) {
      setShowCoachmark(true);
      setTimeout(() => {
        setShowCoachmark(false);
        localStorage.setItem(`wigg-coachmark-${titleId}`, 'true');
      }, 5000);
    }
    
  }, [editable, editState, onEnterEdit, titleId]);

  const clearEditIdleTimer = useCallback(() => {
    if (editIdleTimer) {
      clearTimeout(editIdleTimer);
      setEditIdleTimer(null);
    }
  }, [editIdleTimer]);

  const exitEditMode = useCallback(() => {
    if (editState === 'idle') return;
    
    setEditState('idle');
    setPuckState(null);
    setPaintStroke([]);
    setShowCoachmark(false);
    clearEditIdleTimer();
    onExitEdit?.();
  }, [editState, onExitEdit, clearEditIdleTimer]);

  const resetEditIdleTimer = useCallback(() => {
    if (editIdleTimer) {
      clearTimeout(editIdleTimer);
    }
    
    const timer = setTimeout(() => {
      exitEditMode();
    }, editIdleTimeoutMs);
    
    setEditIdleTimer(timer);
  }, [editIdleTimer, editIdleTimeoutMs, exitEditMode]);

  // Undo functionality with optimistic updates
  const addToUndoStack = useCallback((action: { id: string; pct: number; action: 'place' | 'paint' }) => {
    setUndoStack(prev => {
      const newStack = [...prev, action];
      // Keep only last 5 actions to prevent memory issues
      return newStack.slice(-5);
    });
  }, []);

  const performUndo = useCallback(async () => {
    if (undoStack.length === 0) return;
    
    const lastAction = undoStack[undoStack.length - 1];
    
    try {
      // Optimistically update UI first
      setUndoStack(prev => prev.slice(0, -1));
      
      // Call backend undo (this would need to be implemented in the parent)
      if (lastAction.action === 'place' && onPlaceWigg) {
        // For now, we'll just provide feedback that undo was attempted
        // In a real implementation, this would call an onUndoWigg prop
        console.log('Undo WIGG placement at', lastAction.pct);
      } else if (lastAction.action === 'paint' && onPaintSegmentScore) {
        // Undo paint action
        console.log('Undo paint action at', lastAction.pct);
      }
      
      // Success feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([20, 20]); // Double tap for undo
      }
      
    } catch (error) {
      // Revert optimistic update on error
      setUndoStack(prev => [...prev, lastAction]);
      console.error('Failed to undo action:', error);
    }
  }, [undoStack, onPlaceWigg, onPaintSegmentScore]);

  // Undo gesture detection (three-finger tap or Ctrl+Z)
  const handleUndoGesture = useCallback((event: React.KeyboardEvent | React.TouchEvent) => {
    if ('key' in event) {
      // Keyboard undo (Ctrl+Z or Cmd+Z)
      if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        event.preventDefault();
        performUndo();
      }
    } else if ('touches' in event) {
      // Three-finger tap for mobile undo
      if (event.touches.length === 3) {
        event.preventDefault();
        performUndo();
      }
    }
  }, [performUndo]);

  // Toggle edit mode (external control)
  useEffect(() => {
    if (editable && editState === 'idle') {
      enterEditMode();
      // Announce edit mode activation
      setTimeout(() => {
        if (canvasRef.current) {
          canvasRef.current.focus();
        }
      }, 100);
    } else if (!editable && editState !== 'idle') {
      exitEditMode();
    }
  }, [editable, editState, enterEditMode, exitEditMode]);
  
  // Start idle timer when edit mode becomes active
  useEffect(() => {
    if (editState === 'edit_enabled') {
      resetEditIdleTimer();
    }
  }, [editState, resetEditIdleTimer]);

  // Handle responsive canvas sizing
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const newWidth = Math.min(containerWidth, window.innerWidth < 640 ? containerWidth : 600);
      setCanvasWidth(newWidth);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Error handling wrapper
  const withErrorHandling = useCallback(<T extends unknown[], R>(
    fn: (...args: T) => R,
    context: string
  ) => {
    return (...args: T): R | null => {
      try {
        const startTime = performance.now();
        const result = fn(...args);
        const renderTime = performance.now() - startTime;
        
        // Log performance warning if render takes too long
        if (renderTime > 16) { // 60fps = 16.67ms per frame
          console.warn(`${context} took ${renderTime.toFixed(2)}ms (>16ms)`);
        }
        
        performanceMetrics.current.renderTime = renderTime;
        
        // Memory monitoring (if available)
        if (performance.memory) {
          performanceMetrics.current.memoryUsage = performance.memory.usedJSHeapSize;
        }
        
        return result;
      } catch (error) {
        console.error(`Error in ${context}:`, error);
        setHasError(true);
        setErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return null;
      }
    };
  }, []);

  // Canvas drawing function with error handling and performance monitoring
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const renderMainCanvas = useCallback(withErrorHandling(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasWidth === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions with device pixel ratio for crisp rendering
    const devicePixelRatio = window.devicePixelRatio || 1;
    const displayWidth = canvasWidth;
    const displayHeight = height;

    canvas.width = displayWidth * devicePixelRatio;
    canvas.height = displayHeight * devicePixelRatio;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    ctx.scale(devicePixelRatio, devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    // Draw segments
    const segmentWidth = displayWidth / clampedSegmentCount;
    
    segments.forEach((segment, index) => {
      if (index >= clampedSegmentCount) return;

      const x = index * segmentWidth;
      const score = segment.userScore !== undefined ? segment.userScore : segment.meanScore;
      const opacity = normalizeScore(score);

      // Use CSS custom property colors
      const style = getComputedStyle(document.documentElement);
      const primaryColor = style.getPropertyValue('--primary').trim();
      
      ctx.fillStyle = `hsl(${primaryColor} / ${opacity})`;
      ctx.fillRect(x, 0, segmentWidth - 1, displayHeight);
    });

    // Draw empty segments if not enough data
    if (segments.length < clampedSegmentCount) {
      for (let i = segments.length; i < clampedSegmentCount; i++) {
        const x = i * segmentWidth;
        ctx.fillStyle = `hsl(var(--muted) / 0.3)`;
        ctx.fillRect(x, 0, segmentWidth - 1, displayHeight);
      }
    }

    // Draw T2G pin
    if (t2gEstimatePct !== undefined) {
      const t2gX = (t2gEstimatePct / 100) * displayWidth;
      
      // Star shape for T2G marker
      ctx.fillStyle = 'hsl(var(--primary))';
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      
      ctx.beginPath();
      const starSize = Math.min(12, height * 0.4);
      const starY = height * 0.2;
      
      // Simple star (triangle for now - can be enhanced)
      ctx.moveTo(t2gX, starY);
      ctx.lineTo(t2gX - starSize / 2, starY + starSize);
      ctx.lineTo(t2gX + starSize / 2, starY + starSize);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Draw current position highlight
    if (currentPct !== undefined && currentPct >= 0 && currentPct <= 100) {
      const currentX = (currentPct / 100) * displayWidth;
      ctx.fillStyle = 'hsl(var(--primary) / 0.4)';
      ctx.fillRect(currentX - 2, 0, 4, displayHeight);
    }

    // Draw scrub preview
    if (currentScrubPct !== null && interactive) {
      const scrubX = (currentScrubPct / 100) * displayWidth;
      ctx.strokeStyle = 'hsl(var(--primary))';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(scrubX, 0);
      ctx.lineTo(scrubX, displayHeight);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, 'Main Canvas Rendering'), [canvasWidth, height, segments, clampedSegmentCount, t2gEstimatePct, currentPct, currentScrubPct, interactive, normalizeScore, debouncedPaintBuffer]);

  // Use the render function in useEffect
  useEffect(() => {
    renderMainCanvas();
  }, [renderMainCanvas]);

  // Overlay canvas drawing (puck and fisheye)
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas || canvasWidth === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions matching main canvas
    const devicePixelRatio = window.devicePixelRatio || 1;
    const displayWidth = canvasWidth;
    const displayHeight = height;

    canvas.width = displayWidth * devicePixelRatio;
    canvas.height = displayHeight * devicePixelRatio;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    ctx.scale(devicePixelRatio, devicePixelRatio);
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    // Only render in edit mode or paint mode
    if (editState === 'idle' || (!puckState && !isPaintMode)) return;

    // Render paint mode ghost trail
    if (isPaintMode && paintBuffer.length > 0) {
      ctx.strokeStyle = 'hsl(var(--primary) / 0.6)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Draw smoothed paint trail
      const trailPoints = paintBuffer.map((score, index) => ({
        x: (index / Math.max(paintBuffer.length - 1, 1)) * displayWidth,
        y: displayHeight - (score / 4) * displayHeight
      }));
      
      if (trailPoints.length > 1) {
        ctx.beginPath();
        ctx.moveTo(trailPoints[0].x, trailPoints[0].y);
        
        for (let i = 1; i < trailPoints.length; i++) {
          // Use quadratic curves for smooth drawing
          const prevPoint = trailPoints[i - 1];
          const currentPoint = trailPoints[i];
          const midX = (prevPoint.x + currentPoint.x) / 2;
          const midY = (prevPoint.y + currentPoint.y) / 2;
          
          ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, midX, midY);
        }
        
        // Final point
        const lastPoint = trailPoints[trailPoints.length - 1];
        ctx.lineTo(lastPoint.x, lastPoint.y);
        ctx.stroke();
        
        // Draw current score indicator
        const currentScore = paintBuffer[paintBuffer.length - 1];
        const scoreY = displayHeight - (currentScore / 4) * displayHeight;
        
        ctx.fillStyle = 'hsl(var(--primary))';
        ctx.beginPath();
        ctx.arc(lastPoint.x, scoreY, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        // Score label
        ctx.font = '12px sans-serif';
        ctx.fillStyle = 'hsl(var(--primary))';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(currentScore)}`, lastPoint.x, scoreY - 8);
      }
      
      return; // Skip puck rendering in paint mode
    }

    if (!puckState) return;

    const puckX = (puckState.pct / 100) * displayWidth;
    const puckY = displayHeight / 2;

    // Draw fisheye magnifier
    if (puckState.showFisheye && showFisheye) {
      const fisheyeRadius = 30;
      const fisheyeY = Math.max(fisheyeRadius, puckY - 40);
      
      // Fisheye background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.strokeStyle = 'hsl(var(--primary))';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(puckX, fisheyeY, fisheyeRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Zoomed segment view
      const zoomFactor = puckState.fisheyeZoom;
      const segmentWidth = displayWidth / clampedSegmentCount;
      const zoomedSegmentWidth = segmentWidth * zoomFactor;
      
      ctx.save();
      ctx.beginPath();
      ctx.arc(puckX, fisheyeY, fisheyeRadius - 2, 0, 2 * Math.PI);
      ctx.clip();

      // Draw magnified segments centered around puck
      const centerSegmentIndex = Math.floor((puckState.pct / 100) * clampedSegmentCount);
      const visibleSegments = 3; // Show 3 segments in fisheye
      
      for (let i = -Math.floor(visibleSegments/2); i <= Math.floor(visibleSegments/2); i++) {
        const segmentIndex = centerSegmentIndex + i;
        if (segmentIndex >= 0 && segmentIndex < segments.length) {
          const segment = segments[segmentIndex];
          const score = segment.userScore !== undefined ? segment.userScore : segment.meanScore;
          const opacity = normalizeScore(score);
          
          const segmentX = puckX + (i * zoomedSegmentWidth);
          ctx.fillStyle = `hsl(var(--primary) / ${opacity})`;
          ctx.fillRect(segmentX - zoomedSegmentWidth/2, fisheyeY - fisheyeRadius + 8, zoomedSegmentWidth - 1, fisheyeRadius * 2 - 16);
        }
      }

      ctx.restore();

      // Crosshair in fisheye
      ctx.strokeStyle = 'hsl(var(--primary))';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(puckX, fisheyeY - fisheyeRadius + 5);
      ctx.lineTo(puckX, fisheyeY + fisheyeRadius - 5);
      ctx.stroke();
      ctx.setLineDash([]);

      // Percentage label
      ctx.font = '10px sans-serif';
      ctx.fillStyle = 'hsl(var(--primary))';
      ctx.textAlign = 'center';
      ctx.fillText(`${puckState.pct.toFixed(1)}%`, puckX, fisheyeY + fisheyeRadius + 12);
    }

    // Draw puck
    const puckRadius = 8;
    ctx.fillStyle = puckState.isDragging ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.8)';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(puckX, puckY, puckRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Puck center dot
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(puckX, puckY, 2, 0, 2 * Math.PI);
    ctx.fill();

    // Vertical line from puck to chart
    ctx.strokeStyle = 'hsl(var(--primary) / 0.6)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(puckX, 0);
    ctx.lineTo(puckX, displayHeight);
    ctx.stroke();
    ctx.setLineDash([]);

  }, [canvasWidth, height, editState, puckState, showFisheye, clampedSegmentCount, segments, normalizeScore, isPaintMode, debouncedPaintBuffer, paintBuffer]);

  // Enhanced pointer event handlers with edit mode support
  const getPointerPosition = useCallback((event: React.MouseEvent | React.TouchEvent): { pct: number; y: number } => {
    if (!canvasRef.current) return { pct: 0, y: 0 };
    
    let clientX: number, clientY: number;
    if ('touches' in event) {
      clientX = event.touches[0]?.clientX || 0;
      clientY = event.touches[0]?.clientY || 0;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const position = Math.max(0, Math.min(1, x / rect.width));
    return { pct: position * 100, y };
  }, []);

  // Convert Y position to score (for paint mode)
  const getScoreFromY = useCallback((y: number): number => {
    if (!canvasRef.current) return 2;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const normalizedY = 1 - Math.max(0, Math.min(1, y / rect.height));
    return normalizedY * 4; // 0-4 score range
  }, []);

  // Double-tap handler for quick WIGG placement
  const handleDoubleTap = useCallback(async (pct: number) => {
    if (!onPlaceWigg) return;
    
    try {
      await onPlaceWigg(pct);
      
      // Brief visual feedback
      setPuckState({
        pct,
        isDragging: false,
        showFisheye: false,
        fisheyeZoom: 2.5
      });
      
      setTimeout(() => setPuckState(null), 500);
      
      if ('vibrate' in navigator) {
        navigator.vibrate([30, 30, 30]);
      }
      
    } catch (error) {
      console.error('Failed to place WIGG:', error);
    }
  }, [onPlaceWigg]);

  const handlePointerDown = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    const currentTime = Date.now();
    const timeSinceLastTap = currentTime - lastTapTime;
    const position = getPointerPosition(event);
    const snappedPct = snapToSegment(position.pct);
    
    // Reset idle timer if in edit mode
    if (editState !== 'idle') {
      resetEditIdleTimer();
    }

    // Handle edit mode interactions
    if (editState === 'edit_enabled') {
      // Double-tap detection for quick placement
      if (timeSinceLastTap < 300) {
        handleDoubleTap(snappedPct);
        return;
      }
      
      setLastTapTime(currentTime);
      
      // Initialize paint mode state for potential paint stroke detection
      setIsPaintMode(false);
      setPaintStartY(position.y);
      setPaintBuffer([]);
      
      // Start puck placement
      setEditState('placing');
      setPuckState({
        pct: snappedPct,
        isDragging: true,
        showFisheye: false,
        fisheyeZoom: 2.5
      });

      // Timer for paint mode detection (vertical movement threshold)
      const paintModeTimer = setTimeout(() => {
        // Check if there was significant vertical movement
        if (paintStartY !== null && Math.abs(position.y - paintStartY) > 20) {
          setIsPaintMode(true);
          setEditState('edit_enabled'); // Stay in edit mode for paint
          setPuckState(null); // Clear puck for paint mode
        }
      }, 100);
      
      // Long press detection for fisheye zoom (only if not painting)
      const fisheyeTimer = setTimeout(() => {
        if (!isPaintMode) {
          setPuckState(prev => prev ? { ...prev, showFisheye: true } : null);
          if ('vibrate' in navigator) {
            navigator.vibrate(20);
          }
        }
      }, 300);
      
      setLongPressTimer(fisheyeTimer);
      // Store paint timer for cleanup
      const cleanupTimer = setTimeout(() => clearTimeout(paintModeTimer), 150);
      setTimeout(() => clearTimeout(cleanupTimer), 200);

      return;
    }

    // Standard interactive mode (non-edit)
    if (!interactive || !onScrub) return;
    
    // Only prevent default for mouse events
    if (!('touches' in event)) {
      event.preventDefault();
    }
    
    setIsDragging(true);
    setCurrentScrubPct(snappedPct);
    onScrub(snappedPct);

    // Standard long press for WIGG marking
    if (onMarkWigg) {
      const timer = setTimeout(() => {
        onMarkWigg(snappedPct);
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }, 500);
      setLongPressTimer(timer);
    }
  }, [interactive, onScrub, onMarkWigg, editState, lastTapTime, getPointerPosition, snapToSegment, resetEditIdleTimer, handleDoubleTap, isPaintMode, paintStartY]);

  // Throttled pointer move for performance
  const handlePointerMoveThrottled = useThrottle(
    useCallback((event: React.MouseEvent | React.TouchEvent) => {
    const position = getPointerPosition(event);
    const snappedPct = snapToSegment(position.pct);

    // Handle edit mode paint stroke detection
    if (editState === 'edit_enabled' && isDragging && isPaintMode && paintStartY !== null && onPaintSegmentScore) {
      const currentScore = getScoreFromY(position.y);
      
      // Use EMA smoothing for paint strokes
      const smoothedScore = paintBuffer.length > 0 
        ? paintBuffer[paintBuffer.length - 1] * 0.7 + currentScore * 0.3
        : currentScore;
      
      setPaintBuffer(prev => [...prev, smoothedScore]);
      
      // Batch paint updates (every few pixels)
      if (Math.abs(position.pct - (paintBuffer.length > 0 ? position.pct : 0)) > 2) {
        onPaintSegmentScore(position.pct, Math.round(smoothedScore));
      }
      
      return;
    }

    // Handle edit mode dragging
    if (editState === 'placing' && puckState?.isDragging) {
      setPuckState(prev => prev ? { ...prev, pct: snappedPct } : null);
      
      // Haptic feedback on segment crossing
      if ('vibrate' in navigator && Math.abs(snappedPct - puckState.pct) > (100 / clampedSegmentCount)) {
        navigator.vibrate(10);
      }
      
      return;
    }

    // Standard interactive mode
    if (!isDragging || !onScrub) return;
    
    setCurrentScrubPct(snappedPct);
    onScrub(snappedPct);

    // Haptic feedback on segment change
    if ('vibrate' in navigator && Math.abs(snappedPct - (currentScrubPct || 0)) > 5) {
      navigator.vibrate(10);
    }
  }, [isDragging, onScrub, editState, puckState, getPointerPosition, snapToSegment, currentScrubPct, clampedSegmentCount, isPaintMode, paintStartY, onPaintSegmentScore, getScoreFromY, paintBuffer]),
    16 // Throttle to 60fps
  );
  
  // Alias for backwards compatibility
  const handlePointerMove = handlePointerMoveThrottled;

  const handlePointerUp = useCallback(async () => {
    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    // Handle paint mode completion
    if (isPaintMode && paintBuffer.length > 0 && onPaintSegmentScore) {
      try {
        // Batch commit all paint strokes with optimistic update
        setEditState('committed');
        
        // Calculate average score from paint buffer for final commit
        const avgScore = paintBuffer.reduce((sum, score) => sum + score, 0) / paintBuffer.length;
        const finalScore = Math.round(avgScore);
        
        // This would ideally batch-commit the entire paint stroke
        // For now, commit the final average score at the last known position
        // We'll use the middle of the paint stroke as the commit position
        const commitPct = 50; // Could be improved to track actual stroke position
        await onPaintSegmentScore(commitPct, finalScore);
        
        // Add to undo stack
        addToUndoStack({
          id: `paint_${Date.now()}`,
          pct: commitPct,
          action: 'paint'
        });
        
        // Success feedback
        if ('vibrate' in navigator) {
          navigator.vibrate([30, 30, 30]);
        }
        
        // Reset paint mode
        setIsPaintMode(false);
        setPaintStartY(null);
        setPaintBuffer([]);
        
        // Brief committed state, then back to edit
        setTimeout(() => {
          setEditState('edit_enabled');
        }, 500);
        
      } catch (error) {
        // Revert paint mode on error
        setIsPaintMode(false);
        setPaintStartY(null);
        setPaintBuffer([]);
        setEditState('edit_enabled');
        console.error('Failed to commit paint stroke:', error);
      }
      
      return;
    }

    // Handle edit mode placement
    if (editState === 'placing' && puckState && onPlaceWigg) {
      const finalPct = puckState.pct;
      
      try {
        setEditState('committed');
        await onPlaceWigg(finalPct);
        
        // Add to undo stack
        addToUndoStack({
          id: `wigg_${Date.now()}`,
          pct: finalPct,
          action: 'place'
        });
        
        // Show undo option briefly
        setTimeout(() => {
          if (editState === 'committed') {
            setEditState('edit_enabled');
            setPuckState(null);
          }
        }, 1000);
        
        // Haptic success feedback
        if ('vibrate' in navigator) {
          navigator.vibrate([50, 50, 50]);
        }
        
      } catch (error) {
        // Revert on error
        setEditState('edit_enabled');
        setPuckState(null);
        console.error('Failed to place WIGG:', error);
      }
      
      return;
    }

    // Standard interactive mode
    if (!isDragging) return;

    if (currentScrubPct !== null && onCommitScrub) {
      onCommitScrub(currentScrubPct);
    }

    setIsDragging(false);
    setCurrentScrubPct(null);
    
    // Clean up paint mode state
    setIsPaintMode(false);
    setPaintStartY(null);
    setPaintBuffer([]);
  }, [isDragging, currentScrubPct, onCommitScrub, longPressTimer, editState, puckState, onPlaceWigg, isPaintMode, onPaintSegmentScore, addToUndoStack, paintBuffer]);

  // Keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!interactive) return;

    const currentValue = currentPct || t2gEstimatePct || 0;
    const segmentSize = 100 / clampedSegmentCount;
    let newPct = currentValue;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        newPct = Math.max(0, currentValue - segmentSize);
        break;
      case 'ArrowRight':
        event.preventDefault();
        newPct = Math.min(100, currentValue + segmentSize);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (onMarkWigg) {
          onMarkWigg(currentValue);
        }
        return;
      case 'z':
        if (event.ctrlKey || event.metaKey) {
          handleUndoGesture(event);
          return;
        }
        break;
      case 'Escape':
        if (editState !== 'idle') {
          event.preventDefault();
          exitEditMode();
          return;
        }
        break;
      case 'e':
        if (event.ctrlKey || event.altKey) {
          event.preventDefault();
          if (editState === 'idle' && onEnterEdit) {
            onEnterEdit();
          } else if (editState !== 'idle') {
            exitEditMode();
          }
          return;
        }
        break;
      case 'u':
        if (editState !== 'idle' && (event.ctrlKey || event.altKey)) {
          event.preventDefault();
          performUndo();
          return;
        }
        break;
      case 'Home':
        if (editState !== 'idle' || interactive) {
          event.preventDefault();
          const homePct = 0;
          if (editState === 'placing' && onPlaceWigg) {
            setPuckState({ pct: homePct, isDragging: false, showFisheye: false, fisheyeZoom: 2.5 });
          } else if (onScrub) {
            onScrub(homePct);
            if (onCommitScrub) onCommitScrub(homePct);
          }
          return;
        }
        break;
      case 'End':
        if (editState !== 'idle' || interactive) {
          event.preventDefault();
          const endPct = 100;
          if (editState === 'placing' && onPlaceWigg) {
            setPuckState({ pct: endPct, isDragging: false, showFisheye: false, fisheyeZoom: 2.5 });
          } else if (onScrub) {
            onScrub(endPct);
            if (onCommitScrub) onCommitScrub(endPct);
          }
          return;
        }
        break;
      default:
        return;
    }

    const snappedPct = snapToSegment(newPct);
    if (onScrub) onScrub(snappedPct);
    if (onCommitScrub) onCommitScrub(snappedPct);
  }, [interactive, currentPct, t2gEstimatePct, clampedSegmentCount, onScrub, onCommitScrub, onMarkWigg, snapToSegment, handleUndoGesture, editState, onEnterEdit, exitEditMode, performUndo, onPlaceWigg, setPuckState]);

  // Global mouse up listener for drag operations
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalPointerUp = () => handlePointerUp();
    
    window.addEventListener('mouseup', handleGlobalPointerUp);
    window.addEventListener('touchend', handleGlobalPointerUp);
    
    return () => {
      window.removeEventListener('mouseup', handleGlobalPointerUp);
      window.removeEventListener('touchend', handleGlobalPointerUp);
    };
  }, [isDragging, handlePointerUp]);

  const computedAriaLabel = ariaLabel || 
    `Pacing visualization for ${titleId}${t2gEstimatePct ? `. Gets good around ${Math.round(t2gEstimatePct)}%` : ''}`;

  // Performance monitoring display (disabled)
  const showPerformanceMetrics = false;

  // Error boundary fallback
  if (hasError) {
    return (
      <div className={`w-full ${className}`}>
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
          <div className="text-destructive font-medium mb-2">
            ⚠️ PacingBarcode Error
          </div>
          <div className="text-sm text-destructive/80 mb-3">
            {errorMessage || 'An unexpected error occurred while rendering the pacing visualization.'}
          </div>
          <button
            onClick={() => {
              setHasError(false);
              setErrorMessage(null);
            }}
            className="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm hover:bg-destructive/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`w-full relative ${className}`}
    >
      {/* Main canvas */}
      <canvas
        ref={canvasRef}
        className={`w-full rounded border ${interactive || editable ? 'cursor-pointer' : ''} ${editable ? 'cursor-crosshair' : ''}`}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchStart={(e) => {
          if (e.touches.length === 3) {
            handleUndoGesture(e);
          } else {
            handlePointerDown(e);
          }
        }}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        onKeyDown={handleKeyDown}
        role={editable ? 'application' : interactive ? 'slider' : 'img'}
        aria-label={editable ? `Edit Graph Mode: ${computedAriaLabel}` : computedAriaLabel}
        aria-valuemin={interactive || editable ? 0 : undefined}
        aria-valuemax={interactive || editable ? 100 : undefined}
        aria-valuenow={interactive || editable ? (puckState?.pct || currentPct || t2gEstimatePct || 0) : undefined}
        aria-live={editable ? 'polite' : 'off'}
        aria-describedby={editable ? 'edit-mode-instructions' : undefined}
        tabIndex={interactive || editable ? 0 : -1}
        style={{ touchAction: editState !== 'idle' ? 'none' : (interactive ? 'none' : 'auto') }}
      />

      {/* Overlay canvas for puck and fisheye */}
      <canvas
        ref={overlayCanvasRef}
        className="absolute top-0 left-0 w-full rounded pointer-events-none"
        style={{ touchAction: 'none' }}
      />

      {/* Edit mode coachmark */}
      {showCoachmark && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-primary text-primary-foreground text-xs rounded-md shadow-lg z-10 animate-in fade-in slide-in-from-top-1">
          <div className="font-medium mb-1">Edit Graph Mode</div>
          <div>Tap to drop, drag to fine-tune. Long-press for precision zoom.</div>
        </div>
      )}

      {/* Edit mode status */}
      {editState !== 'idle' && (
        <div className="absolute -top-6 left-0 text-xs text-muted-foreground flex items-center gap-2">
          {editState === 'placing' && puckState && (
            <span>Placing at {puckState.pct.toFixed(1)}% • Release to confirm</span>
          )}
          {editState === 'committed' && (
            <span className="text-green-600">WIGG placed!</span>
          )}
          
          {/* Undo button */}
          {undoStack.length > 0 && editState === 'edit_enabled' && (
            <button
              onClick={performUndo}
              className="ml-auto px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 focus:ring-2 focus:ring-primary focus:outline-none transition-colors"
              title="Undo last action (Ctrl+Z or 3-finger tap)"
              aria-label={`Undo last ${undoStack[undoStack.length - 1]?.action || 'action'}. ${undoStack.length} actions available to undo.`}
              aria-describedby="undo-instructions"
            >
              ↶ Undo ({undoStack.length})
            </button>
          )}
          
          {/* Undo instructions for screen readers */}
          {undoStack.length > 0 && editState === 'edit_enabled' && (
            <div id="undo-instructions" className="sr-only">
              Use Ctrl+Z, Alt+U, or three-finger tap to undo actions
            </div>
          )}
        </div>
      )}
      
      {/* Screen reader text for T2G estimate */}
      {t2gEstimatePct && (
        <div className="sr-only">
          Gets good around {Math.round(t2gEstimatePct)}%
          {editState !== 'idle' && ' • Edit Graph mode active'}
        </div>
      )}
      
      {/* Edit mode instructions for screen readers */}
      {editable && (
        <div id="edit-mode-instructions" className="sr-only">
          Edit Graph Mode active. Tap to place WIGG points, drag to fine-tune position. 
          Long press for precision zoom. Double-tap for quick placement. 
          Use vertical dragging to paint segment scores. 
          Press Ctrl+Z or use three-finger tap to undo. 
          Arrow keys to navigate, Enter to confirm placement, Escape to exit edit mode.
        </div>
      )}
      
      {/* Live announcements for edit mode */}
      {editState !== 'idle' && (
        <div aria-live="assertive" aria-atomic="true" className="sr-only">
          {editState === 'edit_enabled' && 'Edit mode ready. Tap to place WIGG.'}
          {editState === 'placing' && puckState && `Placing WIGG at ${puckState.pct.toFixed(1)} percent. Drag to adjust or release to confirm.`}
          {editState === 'committed' && 'WIGG placed successfully!'}
        </div>
      )}
      
      {/* Performance metrics (development only) */}
      {showPerformanceMetrics && (
        <div className="absolute top-full left-0 mt-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs font-mono">
          <span>Render: {performanceMetrics.current.renderTime.toFixed(1)}ms</span>
          {performanceMetrics.current.memoryUsage > 0 && (
            <span className="ml-2">Memory: {(performanceMetrics.current.memoryUsage / 1024 / 1024).toFixed(1)}MB</span>
          )}
        </div>
      )}
    </div>
  );
});