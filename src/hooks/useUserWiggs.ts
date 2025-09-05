import { useState, useEffect } from 'react';

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

        // Calculate T2G estimate based on existing wiggs (first rating >= 1)
        const firstGoodWigg = mockEntries.find(entry => (entry.rating || 0) >= 1);
        const t2gEstimatePct = firstGoodWigg ? firstGoodWigg.pct : 35; // Default estimate

        const mockData: UserWiggsData = {
          entries: mockEntries,
          t2gEstimatePct
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