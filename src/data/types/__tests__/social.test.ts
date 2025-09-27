import { describe, it, expect } from 'vitest';
import type { Comment, FollowerCounts } from '../social';

describe('Social Data Layer Types', () => {
  it('should export Comment type with all required fields', () => {
    const comment: Comment = {
      id: 'comment-123',
      userId: 'user-456',
      username: 'testuser',
      content: 'Great point!',
      createdAt: '2024-03-01T00:00:00Z'
    };

    expect(comment.id).toBe('comment-123');
    expect(comment.userId).toBe('user-456');
    expect(comment.username).toBe('testuser');
    expect(comment.content).toBe('Great point!');
  });

  it('should export FollowerCounts type with follower and following counts', () => {
    const counts: FollowerCounts = {
      followers: 25,
      following: 42
    };

    expect(counts.followers).toBe(25);
    expect(counts.following).toBe(42);
  });
});