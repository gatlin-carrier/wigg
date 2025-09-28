import { useQuery } from '@tanstack/react-query';
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

export function useTitleMetrics(titleId: string | null | undefined, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;

  const query = useQuery({
    queryKey: ['titleMetrics', titleId],
    queryFn: async () => {
      if (!titleId) return null;

      const { data: rows, error } = await supabase
        .from('title_metrics')
        .select('*')
        .eq('title_id', titleId)
        .limit(1);

      if (error) throw error;
      return rows?.[0] ?? null;
    },
    enabled: enabled && !!titleId,
    staleTime: 5 * 60 * 1000, // 5 minutes - metrics don't change frequently
    gcTime: 10 * 60 * 1000,   // 10 minutes - keep in cache longer
  });

  return {
    data: query.data ?? null,
    loading: query.isLoading || query.isPending,
    error: query.error as Error | null
  } as const;
}

