import { describe, it, expect } from 'vitest';
import type { WiggPoint, CreateWiggPointInput } from '../index';

describe('Data Layer Types', () => {
  it('should export WiggPoint type with all required fields', () => {
    const wiggPoint: WiggPoint = {
      id: 'test-id',
      media_id: 'media-123',
      user_id: 'user-456',
      pos_value: 30,
      pos_kind: 'percent',
      reason_short: 'Test reason',
      spoiler_level: 1,
      created_at: '2024-03-01T00:00:00Z',
      updated_at: '2024-03-01T00:00:00Z'
    };

    expect(wiggPoint.id).toBe('test-id');
    expect(wiggPoint.media_id).toBe('media-123');
    expect(wiggPoint.user_id).toBe('user-456');
  });

  it('should export CreateWiggPointInput type without auto-generated fields', () => {
    const createInput: CreateWiggPointInput = {
      media_id: 'media-123',
      user_id: 'user-456',
      pos_value: 30,
      pos_kind: 'percent',
      reason_short: 'Test reason',
      spoiler_level: 1
    };

    expect(createInput).toBeDefined();
    // Should not have id, created_at, updated_at fields
    expect('id' in createInput).toBe(false);
    expect('created_at' in createInput).toBe(false);
    expect('updated_at' in createInput).toBe(false);
  });
});