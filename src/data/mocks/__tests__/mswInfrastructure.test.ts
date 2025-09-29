import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import { server } from '../setup';
import { userPreferencesClient } from '@/data/clients/userPreferencesClient';

describe('MSW Testing Infrastructure', () => {
  beforeEach(() => {
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  it('should mock user preferences operations', async () => {
    const result = await userPreferencesClient.getUserPreferences('user-123');

    expect(result.success).toBe(true);
    expect(result.data.user_id).toBe('user-123');
  });
});