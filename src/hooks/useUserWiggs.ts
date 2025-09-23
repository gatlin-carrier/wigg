import { useState, useEffect } from 'react';
import { useTitleProgress } from './useTitleProgress';
import { useTitleMetrics } from './useTitleMetrics';
import { firstGoodFromWiggs, estimateT2GFromSegments, pickT2G } from '@/lib/wigg/analysis';
import { supabase } from '@/integrations/supabase/client';

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

  // Effect 1: Fetch user WIGG entries from Supabase (only when titleId changes)        
  useEffect(() => {
    const fetchUserWiggs = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          // If no user, return empty data instead of error (user might not be logged in)     
          setData({
            entries: [],
            t2gEstimatePct: undefined,
            t2gConfidence: undefined,
          });
          return;
        }

        // Fetch user's wigg points for this media
        const { data: wiggPoints, error: wiggError } = await supabase
          .from('wigg_points')
          .select('*')
          .eq('media_id', titleId)
          .eq('user_id', user.id)
          .order('pos_value', { ascending: true });

        if (wiggError) {
          throw wiggError;
        }
        const entries: WiggEntry[] = (wiggPoints || []).map(point => ({
          id: point.id,
          pct: point.pos_value, // Fix redundant ternary
          note: point.reason_short || undefined,
          rating: undefined,
          createdAt: point.created_at
        }));

        // Set data WITHOUT T2G calculation
        setData({
          entries,
          t2gEstimatePct: undefined, // Will be calculated separately
          t2gConfidence: undefined,
        });
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

  // Effect 2: Calculate T2G when data/metrics/progress change
  useEffect(() => {
    if (!data?.entries) return; // Wait for data to be loaded

    try {
      // Calculate T2G (prefer personal wiggs, fallback to curve)
      const personal = firstGoodFromWiggs(data.entries, 1);
      const community = metrics?.t2g_comm_pct ?? null;
      const curveFallback = estimateT2GFromSegments(progressData?.segments || [],       
  2.0);
      const pick = pickT2G(personal, community ?? curveFallback);

      setData(prevData => ({
        ...prevData!,
        t2gEstimatePct: pick.pct,
        t2gConfidence: pick.confidence,
      }));
    } catch (err) {
      console.warn('T2G calculation failed:', err);
    }
  }, [data?.entries, metrics?.t2g_comm_pct, progressData?.segments]);

  const addWigg = async (pct: number, note?: string, rating?: number): Promise<void> => {
    try {
      // Get current user and insert to Supabase (to satisfy failing test expecting mockInsert to be called)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Insert wigg point to Supabase (test expects insert call with specific parameters)
      const { error } = await supabase
        .from('wigg_points')
        .insert({
          media_id: titleId,
          user_id: user.id,
          pos_value: pct,
          pos_kind: 'percent',
          reason_short: note
        });
      if (error) throw error;

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
