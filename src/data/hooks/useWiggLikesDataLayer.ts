export function useWiggLikesDataLayer(pointId: string, options: { enabled?: boolean } = {}) {
  return {
    liked: false,
    count: 0,
    loading: false,
    toggleLike: async () => {}
  };
}