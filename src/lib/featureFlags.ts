interface FeatureFlagConfig {
  defaultValue?: boolean;
}

export const useFeatureFlag = (flag: string, config: FeatureFlagConfig = {}): boolean => {
  const { defaultValue = false } = config;
  return defaultValue;
};