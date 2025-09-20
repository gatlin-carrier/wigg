import { Button } from '@/components/ui/button';
import { useFollowUser } from '@/hooks/social/useFollowUser';
import { Loader2, UserPlus, UserCheck } from 'lucide-react';

interface FollowButtonProps {
  targetUserId: string;
  targetUsername?: string | null;
}

export function FollowButton({ targetUserId, targetUsername }: FollowButtonProps) {
  const { isFollowing, toggle, loading, isOwnProfile } = useFollowUser(targetUserId);

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
