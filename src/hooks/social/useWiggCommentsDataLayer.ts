export function useWiggCommentsDataLayer(pointId?: string) {
  return {
    comments: [],
    loading: false,
    addComment: async () => {},
    deleteComment: async () => {},
    refresh: async () => {},
    canComment: false,
  };
}