import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TitleMetricsRow {
  title_id: string;
  t2g_comm_pct: number | null;
  t2g_comm_iqr: number | null;
  peak_label: string | null;
  peak_at_pct: number | null;
  sample_size: number | null;
  updated_at: string | null;
}

export function useTitleMetrics(titleId: string | null | undefined) {
  const [data, setData] = useState<TitleMetricsRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!titleId) return;
      setLoading(true);
      setError(null);
      try {
        const { data: rows, error } = await supabase
          .from('title_metrics')
          .select('*')
          .eq('title_id', titleId)
          .limit(1);
        if (error) throw error;
        if (!cancelled) setData(rows?.[0] ?? null);
      } catch (e) {
        if (!cancelled) setError(e as Error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [titleId]);

  return { data, loading, error } as const;
}

