# Production Usage Examples - Data Layer Architecture

This document demonstrates how to use the new data layer architecture in production components, showcasing the benefits and patterns established during Phase 2B migration.

## Overview

Our data layer migration provides several key benefits:
- **TanStack Query Integration**: Automatic caching, background updates, optimistic UI
- **Centralized Error Handling**: Consistent `DataLayerResponse` format
- **Type Safety**: Full TypeScript coverage from client to component
- **Interface Compatibility**: Gradual migration without breaking existing code
- **Test-Driven Development**: Comprehensive test coverage for all patterns

## Production Usage Patterns

### Pattern 1: Multiple Data Sources in One Component

```tsx
import React from 'react';
import { useWiggPoints } from '@/data/hooks/useWiggPoints';
import { useUserWiggsDataLayer } from '@/data/hooks/useUserWiggsDataLayer';
import { useSocialData } from '@/data/hooks/useSocialData';

function WiggOverviewComponent({ titleId, userId, pointId }: Props) {
  // 🎯 All hooks use TanStack Query + Data Layer Clients
  const {
    data: wiggPoints,
    isLoading: pointsLoading,
    error: pointsError,
    createWiggPoint
  } = useWiggPoints(titleId);

  const {
    data: userWiggs,
    isLoading: userLoading,
    addWigg
  } = useUserWiggsDataLayer(titleId);

  const {
    likeCount,
    isLiked,
    isLoading: socialLoading,
    toggleLike
  } = useSocialData(pointId);

  // ✅ Unified loading and error states
  const isLoading = pointsLoading || userLoading || socialLoading;
  const hasError = pointsError; // Centralized error handling

  // ✅ Optimistic updates with automatic cache invalidation
  const handleCreatePoint = async () => {
    await createWiggPoint.mutateAsync({
      position: 45.5,
      note: 'Great scene!',
      spoilerLevel: 1
    });
    // UI updates automatically via TanStack Query
  };

  return (
    <div>
      {isLoading && <LoadingSpinner />}
      {hasError && <ErrorDisplay error={hasError} />}

      {/* WIGG Points Management */}
      <WiggPointsList points={wiggPoints} />
      <button onClick={handleCreatePoint}>Add Point</button>

      {/* User Data Display */}
      <UserWiggSummary data={userWiggs?.data} />

      {/* Social Interactions */}
      <LikeButton
        count={likeCount}
        isLiked={isLiked}
        onToggle={toggleLike}
      />
    </div>
  );
}
```

**Benefits Demonstrated:**
- Multiple data sources coordinated seamlessly
- Unified loading states across all data
- Optimistic updates with automatic UI sync
- Centralized error handling patterns

### Pattern 2: Legacy Component Migration

```tsx
// BEFORE: Legacy useState/useEffect pattern
function LegacyComponent({ titleId }: Props) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserWiggs(titleId)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [titleId]);

  return <WiggDisplay data={data} loading={loading} error={error} />;
}

// AFTER: New data layer pattern
function MigratedComponent({ titleId }: Props) {
  // 🎯 Same interface, better implementation
  const { data, isLoading, error } = useUserWiggsDataLayer(titleId);

  // Component code remains identical!
  return <WiggDisplay data={data} loading={isLoading} error={error} />;
}
```

**Benefits Demonstrated:**
- Zero breaking changes to component interface
- Automatic caching and background updates
- Better error handling and loading states
- Type safety improvements

### Pattern 3: Coexistence During Migration

```tsx
function GradualMigrationComponent({ titleId, useNewDataLayer }: Props) {
  // Feature flag determines which pattern to use
  const legacyData = useUserWiggs(titleId, { enabled: !useNewDataLayer });
  const newData = useUserWiggsDataLayer(titleId, { enabled: useNewDataLayer });

  // Both hooks have identical interfaces!
  const data = useNewDataLayer ? newData : legacyData;

  return (
    <div>
      <div className="migration-indicator">
        Using: {useNewDataLayer ? 'New Data Layer' : 'Legacy System'}
      </div>
      <WiggDisplay data={data.data} loading={data.isLoading} />
    </div>
  );
}
```

**Benefits Demonstrated:**
- Gradual rollout capabilities
- A/B testing between old and new systems
- Easy rollback if issues discovered
- Team learning without breaking existing features

### Pattern 4: Error Handling and Recovery

```tsx
function RobustComponent({ titleId }: Props) {
  const {
    data: wiggPoints,
    isLoading,
    error,
    refetch,
    createWiggPoint
  } = useWiggPoints(titleId);

  // 🎯 Standardized error handling
  if (error) {
    return (
      <ErrorBoundary>
        <div className="error-display">
          <h3>Unable to load WIGG points</h3>
          <p>{error.message}</p>
          <button onClick={() => refetch()}>
            Try Again
          </button>
        </div>
      </ErrorBoundary>
    );
  }

  // 🎯 Optimistic updates with error recovery
  const handleCreate = async (pointData: CreateWiggPointInput) => {
    try {
      await createWiggPoint.mutateAsync(pointData);
      // Success: UI already updated optimistically
    } catch (error) {
      // Error: Optimistic update automatically reverted
      showErrorToast('Failed to create point. Please try again.');
    }
  };

  return (
    <div>
      {isLoading ? (
        <SkeletonLoader />
      ) : (
        <WiggPointsGrid
          points={wiggPoints}
          onCreate={handleCreate}
          isCreating={createWiggPoint.isLoading}
        />
      )}
    </div>
  );
}
```

**Benefits Demonstrated:**
- Comprehensive error handling strategies
- Automatic optimistic update rollback on errors
- User-friendly error recovery options
- Loading state management

## Real-World Integration Examples

### Example 1: WIGG Point Creation Form

```tsx
function WiggPointForm({ titleId }: { titleId: string }) {
  const { createWiggPoint } = useWiggPoints(titleId);
  const [formData, setFormData] = useState(initialFormData);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      // 🎯 Optimistic update: UI shows new point immediately
      await createWiggPoint.mutateAsync({
        position: formData.position,
        note: formData.note,
        spoilerLevel: formData.spoilerLevel,
        tags: formData.tags
      });

      // Success: Form resets, cache invalidated, list updates
      setFormData(initialFormData);
      showSuccessToast('WIGG point created!');

    } catch (error) {
      // Error: Optimistic update reverted automatically
      showErrorToast('Failed to create point');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PositionSlider
        value={formData.position}
        onChange={(pos) => setFormData({...formData, position: pos})}
      />
      <NoteInput
        value={formData.note}
        onChange={(note) => setFormData({...formData, note})}
      />
      <SpoilerLevelSelect
        value={formData.spoilerLevel}
        onChange={(level) => setFormData({...formData, spoilerLevel: level})}
      />
      <button
        type="submit"
        disabled={createWiggPoint.isLoading}
      >
        {createWiggPoint.isLoading ? 'Creating...' : 'Add WIGG Point'}
      </button>
    </form>
  );
}
```

### Example 2: Social Interaction Component

```tsx
function SocialInteractions({ pointId }: { pointId: string }) {
  const {
    likeCount,
    isLiked,
    isLoading,
    toggleLike,
    refreshData
  } = useSocialData(pointId);

  return (
    <div className="social-controls">
      <button
        onClick={toggleLike}
        disabled={isLoading}
        className={`like-button ${isLiked ? 'liked' : ''}`}
      >
        {isLiked ? '❤️' : '🤍'} {likeCount}
      </button>

      <button
        onClick={refreshData}
        disabled={isLoading}
        className="refresh-button"
      >
        🔄 Refresh
      </button>

      {isLoading && <span className="loading">⚡</span>}
    </div>
  );
}
```

### Example 3: User Preference Settings

```tsx
function UserPreferencesPanel({ userId }: { userId: string }) {
  const { data: preferences, isLoading, updatePreferences } = useUserPreferences(userId);

  const handleSpoilerLevelChange = async (level: number) => {
    await updatePreferences.mutateAsync({
      spoiler_sensitivity: level
    });
    // UI updates optimistically, then syncs with server
  };

  if (isLoading) return <PreferencesSkeleton />;

  return (
    <div className="preferences-panel">
      <SpoilerSensitivitySlider
        value={preferences?.spoiler_sensitivity || 0}
        onChange={handleSpoilerLevelChange}
        disabled={updatePreferences.isLoading}
      />

      <TrustedUsersManager
        users={preferences?.trusted_users || []}
        onUpdate={(users) => updatePreferences.mutateAsync({ trusted_users: users })}
      />
    </div>
  );
}
```

## Performance Benefits

### Automatic Caching
```tsx
// First render: Data fetched from server
<WiggPointsList titleId="movie-123" />

// Subsequent renders: Data served from cache instantly
<WiggPointsList titleId="movie-123" /> // ⚡ Instant load

// Background refetch happens automatically
```

### Request Deduplication
```tsx
// Multiple components requesting same data
<ComponentA titleId="movie-123" /> // Triggers API call
<ComponentB titleId="movie-123" /> // Uses same request, no duplicate call
<ComponentC titleId="movie-123" /> // Uses same request, no duplicate call
```

### Optimistic Updates
```tsx
// User clicks "Like" button
<LikeButton onLike={toggleLike} /> // UI updates immediately
// ✅ User sees instant feedback
// 🔄 Server sync happens in background
// ❌ Automatically reverts if server request fails
```

## Migration Checklist

### For New Components
- [ ] Use data layer hooks (`useWiggPoints`, `useSocialData`, etc.)
- [ ] Handle loading and error states consistently
- [ ] Implement optimistic updates for mutations
- [ ] Use TypeScript throughout for type safety
- [ ] Write tests that cover success and error scenarios

### For Existing Components
- [ ] Identify current data fetching patterns
- [ ] Find equivalent data layer hook
- [ ] Update imports and hook usage
- [ ] Verify interface compatibility
- [ ] Test with feature flag for gradual rollout
- [ ] Remove legacy data fetching code after validation

### For Teams
- [ ] Review data layer migration guide
- [ ] Set up feature flags for gradual rollout
- [ ] Plan component migration priority
- [ ] Test new patterns in development environment
- [ ] Monitor performance improvements in production

## Conclusion

The new data layer architecture provides significant benefits:

1. **Better Performance**: Automatic caching, request deduplication, optimistic updates
2. **Improved Reliability**: Centralized error handling, consistent loading states
3. **Enhanced Developer Experience**: Type safety, interface compatibility, test coverage
4. **Future-Proof Scalability**: Modular design, consistent patterns, migration-friendly

The patterns demonstrated here show how to leverage these benefits in real production components while maintaining compatibility with existing code during the migration period.