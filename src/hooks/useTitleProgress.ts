import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFeatureFlag } from '@/lib/featureFlags';

export interface ProgressSegment {
  startPct: number;
  endPct: number;
  meanScore?: number;
  userScore?: number;
}

export interface TitleProgressData {
  totalLengthSeconds?: number;
  totalLengthPercent?: number;
  segments: ProgressSegment[];
}

export function useTitleProgress(titleId: string, options: { enabled?: boolean } = {}): {
  data: TitleProgressData | null;
  isLoading: boolean;
  error: Error | null;
} {
  const { enabled = true } = options;
  const useReactQuery = useFeatureFlag('title-progress-react-query', { defaultValue: true });

  // React Query implementation
  if (useReactQuery) {
    const result = useQuery({
      queryKey: ['titleProgress', titleId],
      queryFn: async () => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        // Return fixed data for testing
        return {
          totalLengthSeconds: 7200,
          totalLengthPercent: 100,
          segments: Array.from({ length: 20 }, (_, i) => ({
            startPct: (i / 20) * 100,
            endPct: ((i + 1) / 20) * 100,
            meanScore: 2.5,
            userScore: undefined
          }))
        };
      },
      enabled: enabled && !!titleId,
    });

    return {
      data: result.data ?? null,
      isLoading: result.isLoading,
      error: result.error as Error | null
    };
  }

  // Legacy implementation
  const [data, setData] = useState<TitleProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Mock implementation - replace with actual API call
    const fetchTitleProgress = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock data generation - create segments with varying scores
        const segmentCount = 20;
        const segments: ProgressSegment[] = [];

        for (let i = 0; i < segmentCount; i++) {
          const startPct = (i / segmentCount) * 100;
          const endPct = ((i + 1) / segmentCount) * 100;

          // Create a curve that starts low, peaks in middle-late, then varies
          let mockScore: number | undefined;
          const position = i / (segmentCount - 1);

          if (position < 0.2) {
            // Early segments: generally low scores
            mockScore = Math.random() * 2 + 0.5; // 0.5-2.5
          } else if (position < 0.6) {
            // Middle segments: rising scores
            mockScore = Math.random() * 1.5 + 1.5 + (position - 0.2) * 2; // 1.5-4
          } else {
            // Later segments: high scores with some variation
            mockScore = Math.random() * 1.5 + 2.5; // 2.5-4
          }

          segments.push({
            startPct,
            endPct,
            meanScore: Math.min(4, Math.max(0, mockScore)),
            userScore: Math.random() > 0.7 ? Math.min(4, Math.max(0, mockScore + (Math.random() - 0.5))) : undefined
          });
        }

        const mockData: TitleProgressData = {
          totalLengthSeconds: 7200, // 2 hours for example
          totalLengthPercent: 100,
          segments
        };

        setData(mockData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch title progress'));
      } finally {
        setIsLoading(false);
      }
    };

    if (titleId && enabled) {
      fetchTitleProgress();
    } else if (!enabled) {
      setIsLoading(false);
    }
  }, [titleId, enabled]);

  return { data, isLoading, error };
}