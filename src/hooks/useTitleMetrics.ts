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

async function fetchTitleMetrics(titleId: string): Promise<TitleMetricsRow | null> {
  const { data: rows, error } = await supabase
    .from('title_metrics')
    .select('*')
    .eq('title_id', titleId)
    .limit(1);

  if (error) throw error;
  return rows?.[0] ?? null;
}

export function useTitleMetrics(titleId: string | null | undefined) {
  const queryResult = useQuery({
    queryKey: ['titleMetrics', titleId],
    queryFn: () => fetchTitleMetrics(titleId!),
    enabled: !!titleId,
    staleTime: 5 * 60 * 1000, // 5 minutes - prevents excessive refetching that caused 118 API calls
    gcTime: 10 * 60 * 1000,   // 10 minutes - keep in cache longer for better performance
  });

  // Maintain backward compatibility with existing interface
  return {
    data: queryResult.data ?? null,
    loading: queryResult.isLoading,
    error: queryResult.error as Error | null,
  } as const;
}