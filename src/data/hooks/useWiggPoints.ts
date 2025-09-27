import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { wiggPointsClient } from '@/data/clients/wiggPointsClient';
import type { WiggPoint } from '@/data/types';
import { supabase } from '@/integrations/supabase/client';

// Implementation with client data integration
export function useWiggPointsData(mediaId: string) {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<WiggPoint[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user && mediaId) {
          const result = await wiggPointsClient.getUserWiggPoints(user.id, mediaId);
          setData(result);
        }
        supabase.from('wigg_points');
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch data'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user, mediaId]);

  const addWiggPoint = async (wiggData: any) => {
    setIsAdding(true);
    setAddError(null);

    try {
      const newWiggPoint = await wiggPointsClient.createWiggPoint(wiggData);
      setData(prevData => [...prevData, newWiggPoint]);
    } catch (err) {
      setAddError(err instanceof Error ? err : new Error('Failed to add wigg point'));
    } finally {
      setIsAdding(false);
    }
  };

  return {
    isLoading,
    data,
    error,
    addWiggPoint,
    isAdding,
    addError,
  };
}