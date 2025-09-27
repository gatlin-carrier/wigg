import { useEffect, useState } from 'react';
import { socialService } from '@/lib/api/services/social';

export function useFollowerCounts(userId?: string | null) {
  const [followers, setFollowers] = useState<number | null>(null);
  const [following, setFollowing] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setFollowers(null);
      setFollowing(null);
      return;
    }
    let active = true;
    setLoading(true);

    const fetchCounts = async () => {
      try {
        const result = await socialService.getFollowerCounts(userId);
        if (!active) return;

        if (result.success) {
          setFollowers(result.data.followers);
          setFollowing(result.data.following);
        } else {
          console.error('Error fetching follower counts:', result.error.message);
        }
      } catch (error) {
        if (active) {
          console.error('Error fetching follower counts:', error);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchCounts();

    return () => {
      active = false;
    };
  }, [userId]);

  return {
    followers,
    following,
    loading,
  };
}
