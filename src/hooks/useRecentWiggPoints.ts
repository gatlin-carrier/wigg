import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface RecentWiggState {
  entries: Array<Record<string, unknown>>;
  loading: boolean;
  error: Error | null;
}

export function useRecentWiggPoints(limit = 5): RecentWiggState {
  const { user } = useAuth();
  const [state, setState] = useState<RecentWiggState>({ entries: [], loading: true, error: null });

  useEffect(() => {
    let mounted = true;

    async function fetchRecent() {
      if (!user) {
        if (mounted) setState({ entries: [], loading: false, error: null });
        return;
      }
      const { data, error } = await supabase
        .from('wigg_points')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!mounted) return;
      if (error) {
        setState({ entries: [], loading: false, error });
      } else {
        setState({ entries: data ?? [], loading: false, error: null });
      }
    }

    fetchRecent();
    return () => {
      mounted = false;
    };
  }, [user, limit]);

  return state;
}
