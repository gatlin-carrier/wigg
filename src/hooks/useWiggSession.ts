import { useState, useCallback } from "react";
import { type Unit, type SwipeValue } from "@/components/wigg/SwipeRating";
import { type Moment } from "@/components/wigg/MomentCapture";
import { type SessionStats } from "@/components/wigg/SessionRecap";
import { type MediaSearchResult } from "@/components/media/MediaSearch";

interface UseWiggSessionState {
  selectedMedia: MediaSearchResult | null;
  units: Unit[];
  currentUnitIndex: number;
  moments: Moment[];
  sessionStats: SessionStats;
  progress: number;
}

interface UseWiggSessionActions {
  setSelectedMedia: (media: MediaSearchResult | null) => void;
  setUnits: (units: Unit[]) => void;
  recordSwipe: (value: SwipeValue) => void;
  addMoment: (moment: Moment) => void;
  nextUnit: () => void;
  resetSession: () => void;
  setProgress: (progress: number) => void;
}

export function useWiggSession(): UseWiggSessionState & UseWiggSessionActions {
  const [selectedMedia, setSelectedMedia] = useState<MediaSearchResult | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [currentUnitIndex, setCurrentUnitIndex] = useState(0);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [progress, setProgress] = useState(1);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    n: 0,
    peak: 0,
    good: 0,
    ok: 0,
    skip: 0,
  });

  const recordSwipe = useCallback((value: SwipeValue) => {
    setSessionStats((prev) => ({
      n: prev.n + 1,
      peak: prev.peak + (value === 3 ? 1 : 0),
      good: prev.good + (value === 2 ? 1 : 0),
      ok: prev.ok + (value === 1 ? 1 : 0),
      skip: prev.skip + (value === 0 ? 1 : 0),
    }));
  }, []);

  const addMoment = useCallback((moment: Moment) => {
    setMoments((prev) => [moment, ...prev].slice(0, 12));
  }, []);

  const nextUnit = useCallback(() => {
    setCurrentUnitIndex((prev) => Math.min(units.length, prev + 1));
  }, [units.length]);

  const resetSession = useCallback(() => {
    setCurrentUnitIndex(0);
    setMoments([]);
    setProgress(1);
    setSessionStats({ n: 0, peak: 0, good: 0, ok: 0, skip: 0 });
  }, []);

  return {
    selectedMedia,
    units,
    currentUnitIndex,
    moments,
    sessionStats,
    progress,
    setSelectedMedia,
    setUnits,
    recordSwipe,
    addMoment,
    nextUnit,
    resetSession,
    setProgress,
  };
}