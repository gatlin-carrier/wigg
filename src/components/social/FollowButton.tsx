import { Button } from '@/components/ui/button';
import { useFollowUser } from '@/hooks/social/useFollowUser';
import { useFollowUserDataLayer } from '@/hooks/social/useFollowUserDataLayer';
import { useFeatureFlag } from '@/lib/featureFlags';
import { Loader2, UserPlus, UserCheck } from 'lucide-react';

interface FollowButtonProps {
  targetUserId: string;
  targetUsername?: string | null;
}

export function FollowButton({ targetUserId, targetUsername }: FollowButtonProps) {
  // Feature flag for data layer coexistence
  const useNewDataLayer = useFeatureFlag('follow-button-data-layer');
  const legacyFollowData = useFollowUser(targetUserId);
  const newFollowData = useFollowUserDataLayer(targetUserId);
  const { isFollowing, toggle, loading, isOwnProfile } = useNewDataLayer ? newFollowData : legacyFollowData;

  if (isOwnProfile) return null;

  return (
    <Button variant={isFollowing ? 'outline' : 'secondary'} size="sm" onClick={toggle} disabled={loading}>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserCheck className="mr-1 h-4 w-4" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="mr-1 h-4 w-4" />
          Follow
          {targetUsername ? ` ${targetUsername}` : ''}
        </>
      )}
    </Button>
  );
}

export default FollowButton;
