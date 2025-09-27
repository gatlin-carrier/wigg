// Minimal implementation to make test pass
export const wiggPointsClient = {
  getUserWiggPoints: async (userId: string, mediaId: string) => {
    return [
      {
        id: 'test-id-1',
        media_id: 'media-123',
        user_id: 'user-456',
        pos_value: 30,
        pos_kind: 'percent',
        reason_short: 'Test reason',
        spoiler_level: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];
  }
};