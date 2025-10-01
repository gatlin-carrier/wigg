import { useState, useEffect, useMemo } from 'react';
import { useTitleProgress } from './useTitleProgress';
import { useTitleMetrics } from './useTitleMetrics';
import { useAuth } from './useAuth';
import { firstGoodFromWiggs, estimateT2GFromSegments, pickT2G } from '@/lib/wigg/analysis';
import { supabase } from '@/integrations/supabase/client';

// CRITICAL FIX: MediaTile.tsx expects useUserWiggs(titleKey, { enabled: !useNewDataLayer })
// API performance test shows 118+ calls to title_metrics when should be <20
// This hook needs to support conditional execution to prevent duplicate API calls

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

export function useUserWiggs(titleId: string, options?: { enabled?: boolean }): {
  data: UserWiggsData | null;
  isLoading: boolean;
  error: Error | null;
  addWigg: (pct: number, note?: string, rating?: number) => Promise<void>;
} {
  // Extract enabled option to fix API performance issue (118+ calls to title_metrics)
  const { enabled = true } = options || {};

  const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  const normalizedTitleId = (titleId || '').trim();
  const isDatabaseMediaId = UUID_REGEX.test(normalizedTitleId);
  const shouldLoadFromSupabase = enabled && isDatabaseMediaId;

  const [data, setData] = useState<UserWiggsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { data: progressData } = useTitleProgress(normalizedTitleId, { enabled: shouldLoadFromSupabase });
  const { data: metrics } = useTitleMetrics(normalizedTitleId, { enabled: shouldLoadFromSupabase });
  // Use centralized authentication state from useAuth hook instead of direct Supabase calls
  // This prevents excessive API calls and ensures consistent user state across the application
  const { user } = useAuth();

  // Effect 1: Fetch user WIGG entries from Supabase (only when titleId changes)        
  useEffect(() => {
    const fetchUserWiggs = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (!shouldLoadFromSupabase) {
          setData({
            entries: [],
            t2gEstimatePct: undefined,
            t2gConfidence: undefined,
          });
          return;
        }

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
          .eq('media_id', normalizedTitleId)
          .eq('user_id', user.id)
          .order('pos_value', { ascending: true });

        if (wiggError) {
          throw wiggError;
        }
        const entries: WiggEntry[] = (wiggPoints || []).map(point => ({
          id: point.id,
          pct: point.pos_value,
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

    if (normalizedTitleId && enabled) {
      fetchUserWiggs();
    } else if (!enabled) {
      setIsLoading(false);
    } else if (!normalizedTitleId) {
      setData({
        entries: [],
        t2gEstimatePct: undefined,
        t2gConfidence: undefined,
      });
      setIsLoading(false);
    }
  }, [normalizedTitleId, user, enabled, shouldLoadFromSupabase]);

  // Effect 2: Calculate T2G when data/metrics/progress change
  useEffect(() => {
    if (!data?.entries) return; // Wait for data to be loaded

    try {
      // Calculate T2G (prefer personal wiggs, fallback to curve)
      const personal = firstGoodFromWiggs(data.entries, 1);
      const community = metrics?.t2g_comm_pct ?? null;
      const curveFallback = estimateT2GFromSegments(progressData?.segments || [], 2.0);
      const pick = pickT2G(personal, community ?? curveFallback);

      setData(prevData => ({
        ...prevData!,
        t2gEstimatePct: pick.pct,
        t2gConfidence: pick.confidence,
      }));
    } catch (err) {
      console.warn('T2G calculation failed:', err);
    }
  }, [data?.entries, metrics?.t2g_comm_pct, progressData?.segments?.length]);

  const addWigg = async (pct: number, note?: string, rating?: number): Promise<void> => {
    try {
      // Get current user and insert to Supabase (to satisfy failing test expecting mockInsert to be called)
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      if (!shouldLoadFromSupabase) {
        throw new Error('Media must exist in the library before adding a WIGG point');
      }

      // Insert wigg point to Supabase (test expects insert call with specific parameters)
      const { error } = await supabase
        .from('wigg_points')
        .insert({
          media_id: normalizedTitleId,
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
