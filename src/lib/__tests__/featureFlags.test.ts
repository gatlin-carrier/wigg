import { describe, it, expect } from 'vitest';
import { useFeatureFlag } from '../featureFlags';

describe('useFeatureFlag', () => {
  it('should return false for disabled feature flag by default', () => {
    const isEnabled = useFeatureFlag('test-flag');

    expect(isEnabled).toBe(false);
  });

  it('should return true when feature flag is enabled via defaultValue', () => {
    const isEnabled = useFeatureFlag('test-flag', { defaultValue: true });

    expect(isEnabled).toBe(true);
  });
});