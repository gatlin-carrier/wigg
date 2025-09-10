import { useState, useEffect } from 'react';
import { useTitleProgress } from './useTitleProgress';
import { useTitleMetrics } from './useTitleMetrics';
import { firstGoodFromWiggs, estimateT2GFromSegments, pickT2G } from '@/lib/wigg/analysis';

export interface WiggEntry {
  id: string;
  pct: number;
  note?: string;
  createdAt: string;
  rating?: number; // 0-3 scale matching SwipeValue
}

export interface UserWiggsData {
  entries: WiggEntry[];
  t2gEstimatePct?: number; // Time-to-good estimate
  t2gConfidence?: number;  // 0..1 heuristic
}

export function useUserWiggs(titleId: string): {
  data: UserWiggsData | null;
  isLoading: boolean;
  error: Error | null;
  addWigg: (pct: number, note?: string, rating?: number) => Promise<void>;
} {
  const [data, setData] = useState<UserWiggsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { data: progressData } = useTitleProgress(titleId);
  const { data: metrics } = useTitleMetrics(titleId);

  useEffect(() => {
    // Mock implementation - replace with actual API call
    const fetchUserWiggs = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));

        // Mock existing wigg entries
        const mockEntries: WiggEntry[] = [
          {
            id: '1',
            pct: 25.5,
            note: 'Story picks up here',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            rating: 1
          },
          {
            id: '2',
            pct: 45.2,
            note: 'Great action sequence',
            createdAt: new Date(Date.now() - 43200000).toISOString(),
            rating: 2
          },
          {
            id: '3',
            pct: 67.8,
            createdAt: new Date(Date.now() - 21600000).toISOString(),
            rating: 3
          }
        ];

        // Calculate T2G (prefer personal wiggs, fallback to curve)
        const personal = firstGoodFromWiggs(mockEntries, 1);
        const community = metrics?.t2g_comm_pct ?? null;
        const curveFallback = estimateT2GFromSegments(progressData?.segments || [], 2.0);
        const pick = pickT2G(personal, community ?? curveFallback);

        const mockData: UserWiggsData = {
          entries: mockEntries,
          t2gEstimatePct: pick.pct,
          t2gConfidence: pick.confidence,
        };

        setData(mockData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch user wiggs'));
      } finally {
        setIsLoading(false);
      }
    };

    if (titleId) {
      fetchUserWiggs();
    }
  }, [titleId]);

  const addWigg = async (pct: number, note?: string, rating?: number): Promise<void> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 200));

      const newWigg: WiggEntry = {
        id: Date.now().toString(),
        pct,
        note,
        createdAt: new Date().toISOString(),
        rating
      };

      setData(prevData => {
        if (!prevData) return prevData;

        const newEntries = [...prevData.entries, newWigg].sort((a, b) => a.pct - b.pct);
        
        // Recalculate T2G estimate
        const firstGoodWigg = newEntries.find(entry => (entry.rating || 0) >= 1);
        const t2gEstimatePct = firstGoodWigg ? firstGoodWigg.pct : prevData.t2gEstimatePct;

        return {
          ...prevData,
          entries: newEntries,
          t2gEstimatePct
        };
      });
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to add wigg');
    }
  };

  return { data, isLoading, error, addWigg };
}
