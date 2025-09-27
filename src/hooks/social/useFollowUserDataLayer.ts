export function useFollowUserDataLayer(targetUserId?: string | null) {
  return {
    isFollowing: false,
    loading: false,
    toggle: () => {},
    isOwnProfile: false,
  };
}