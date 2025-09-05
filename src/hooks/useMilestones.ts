import { useState, useEffect } from 'react';

export interface Milestone {
  id: string;
  pct: number;
  label: string;
  icon?: React.ReactNode;
}

export interface MilestonesData {
  items: Milestone[];
}

export function useMilestones(titleId: string): {
  data: MilestonesData | null;
  isLoading: boolean;
  error: Error | null;
} {
  const [data, setData] = useState<MilestonesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Mock implementation - replace with actual API call
    const fetchMilestones = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 400));

        // Mock milestones based on title type
        // In real implementation, this would come from content database or scraping
        const mockMilestones: Milestone[] = [
          {
            id: '1',
            pct: 5,
            label: 'Tutorial',
            icon: '🎯'
          },
          {
            id: '2',
            pct: 15,
            label: 'First Challenge',
            icon: '⚔️'
          },
          {
            id: '3',
            pct: 30,
            label: 'Plot Twist',
            icon: '🔄'
          },
          {
            id: '4',
            pct: 50,
            label: 'Midpoint',
            icon: '⚖️'
          },
          {
            id: '5',
            pct: 65,
            label: 'Major Boss',
            icon: '🏆'
          },
          {
            id: '6',
            pct: 85,
            label: 'Climax',
            icon: '🔥'
          },
          {
            id: '7',
            pct: 95,
            label: 'Resolution',
            icon: '✨'
          }
        ];

        const mockData: MilestonesData = {
          items: mockMilestones
        };

        setData(mockData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch milestones'));
      } finally {
        setIsLoading(false);
      }
    };

    if (titleId) {
      fetchMilestones();
    }
  }, [titleId]);

  return { data, isLoading, error };
}