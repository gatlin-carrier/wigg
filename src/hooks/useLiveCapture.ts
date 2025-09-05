import { useState, useEffect, useCallback } from 'react';

export interface LiveCaptureData {
  currentPct: number;
  isActive: boolean;
}

export function useLiveCapture(): {
  data: LiveCaptureData;
  markWigg: (pct: number, note?: string) => Promise<void>;
  setCurrentPct: (pct: number) => void;
  startCapture: () => void;
  stopCapture: () => void;
} {
  const [currentPct, setCurrentPct] = useState(0);
  const [isActive, setIsActive] = useState(false);

  // Mock auto-progression for demo purposes
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive) {
      interval = setInterval(() => {
        setCurrentPct(prev => {
          const newPct = prev + (Math.random() * 0.5); // Slow progression
          return Math.min(100, newPct);
        });
      }, 5000); // Update every 5 seconds when active
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  const markWigg = useCallback(async (pct: number, note?: string): Promise<void> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // In real implementation, this would send to backend
      console.log(`Marked wigg at ${pct}%`, note ? `with note: ${note}` : '');
      
      // Could trigger optimistic update or toast notification
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to mark wigg');
    }
  }, []);

  const startCapture = useCallback(() => {
    setIsActive(true);
  }, []);

  const stopCapture = useCallback(() => {
    setIsActive(false);
  }, []);

  const updateCurrentPct = useCallback((pct: number) => {
    setCurrentPct(Math.max(0, Math.min(100, pct)));
  }, []);

  return {
    data: {
      currentPct,
      isActive
    },
    markWigg,
    setCurrentPct: updateCurrentPct,
    startCapture,
    stopCapture
  };
}