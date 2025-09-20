import { useCallback, useMemo } from 'react';

interface AnalyticsWorkerApi {
  isSupported: boolean;
  track: (event: string, payload?: Record<string, unknown>) => void;
  page: (path: string) => void;
}

export const useAnalyticsWorker = (): AnalyticsWorkerApi => {
  const isSupported = typeof window !== 'undefined' && typeof Worker !== 'undefined';

  const track = useCallback<AnalyticsWorkerApi['track']>((_event, _payload) => {
    // Worker implementation will be added later; no-op for now.
  }, []);

  const page = useCallback<AnalyticsWorkerApi['page']>((_path) => {
    // Worker implementation will be added later; no-op for now.
  }, []);

  return useMemo(() => ({ isSupported, track, page }), [isSupported, track, page]);
};
