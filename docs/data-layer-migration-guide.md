# Data Layer Migration Guide

This guide demonstrates how to migrate existing hooks and API patterns to the new data layer architecture while maintaining compatibility with legacy code.

## Overview

The data layer migration follows these key principles:

1. **Interface Compatibility**: New hooks maintain the same interface as legacy versions
2. **TanStack Query Integration**: Use modern data fetching with caching and state management
3. **Centralized Clients**: Route data access through standardized client modules
4. **Error Handling**: Standardized `DataLayerResponse` pattern
5. **Test-Driven Development**: Incremental migration following TDD principles

## Migration Patterns

### Pattern 1: Basic Data Fetching Hook Migration

**Legacy Pattern** (`useUserWiggs`):
```typescript
// Legacy: Direct Supabase calls with useState/useEffect
export const useUserWiggs = (titleId: string) => {
  const [data, setData] = useState<UserWiggsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Direct Supabase client usage
      const { data: wiggsData, error } = await supabase
        .from('wigg_points')
        .select('*')
        .eq('media_id', titleId);
      // Manual state management
    };
    fetchData();
  }, [titleId]);

  return { data, isLoading, error, addWigg };
};
```

**New Data Layer Pattern** (`useUserWiggsDataLayer`):
```typescript
// New: TanStack Query + Data Layer Client
export const useUserWiggsDataLayer = (titleId: string) => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['userWiggs', titleId, user?.id],
    queryFn: () => wiggPointsClient.getUserWiggPoints(user?.id || '', titleId),
    enabled: !!titleId && !!user
  });

  // Transform data to match legacy format
  const transformedData: UserWiggsData | null = query.data?.success
    ? {
        entries: query.data.data.map(point => ({
          id: point.id,
          pct: point.pos_value,
          note: point.reason_short || undefined,
          createdAt: point.created_at,
          rating: undefined
        } as WiggEntry)),
        t2gEstimatePct: undefined,
        t2gConfidence: undefined
      }
    : // fallback structure

  return {
    data: transformedData,
    isLoading: query.isLoading,
    error: null,
    addWigg: async (pct: number, note?: string, rating?: number): Promise<void> => {
      // Implementation using wiggPointsClient
    }
  };
};
```

**Key Migration Steps**:
1. Replace `useState`/`useEffect` with `useQuery`
2. Route data access through client modules
3. Add data transformation layer for compatibility
4. Maintain exact interface match

### Pattern 2: Multi-Query Hook Migration

**Legacy Pattern** (`useWiggLikes`):
```typescript
// Legacy: Multiple useState for different data pieces
export const useWiggLikes = (pointId: string) => {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Manual Promise.all for concurrent fetches
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [likeCountResult, hasLikedResult] = await Promise.all([
          socialService.getLikeCount(pointId),
          socialService.hasUserLiked(pointId, user?.id)
        ]);
        setCount(likeCountResult);
        setLiked(hasLikedResult);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [pointId, user]);

  return { liked, count, loading, toggleLike, refreshCount };
};
```

**New Data Layer Pattern** (`useWiggLikesDataLayer`):
```typescript
// New: Separate TanStack Queries with automatic coordination
export const useWiggLikesDataLayer = (pointId: string) => {
  const { user } = useAuth();

  const likeCountQuery = useQuery({
    queryKey: ['likeCount', pointId],
    queryFn: () => socialClient.getLikeCount(pointId),
    enabled: !!pointId
  });

  const hasUserLikedQuery = useQuery({
    queryKey: ['hasUserLiked', pointId, user?.id],
    queryFn: () => socialClient.hasUserLiked(pointId, user?.id || ''),
    enabled: !!pointId && !!user
  });

  return {
    liked: hasUserLikedQuery.data?.success ? hasUserLikedQuery.data.data : false,
    count: likeCountQuery.data?.success ? likeCountQuery.data.data : 0,
    loading: likeCountQuery.isLoading || hasUserLikedQuery.isLoading,
    toggleLike: () => {}, // Implementation with useMutation
    refreshCount: () => {} // Implementation with query invalidation
  };
};
```

**Key Migration Steps**:
1. Replace manual `Promise.all` with separate `useQuery` calls
2. TanStack Query automatically coordinates parallel requests
3. Combine loading states with logical OR
4. Extract data from `DataLayerResponse` format

## Test Migration Patterns

### TDD Migration Approach

1. **Create failing test for interface compatibility**:
```typescript
it('should provide same interface as legacy useWiggLikes hook', async () => {
  const { result } = renderHook(() => useWiggLikesDataLayer('point-123'), { wrapper });

  // Verify interface matches exactly
  expect(result.current).toMatchObject({
    liked: expect.any(Boolean),
    count: expect.any(Number),
    loading: expect.any(Boolean),
    toggleLike: expect.any(Function),
    refreshCount: expect.any(Function)
  });
});
```

2. **Add specific behavior tests**:
```typescript
it('should use socialClient for data fetching and show loading state', async () => {
  const { result } = renderHook(() => useWiggLikesDataLayer('point-123'), { wrapper });

  // Should start with loading state when using real queries
  expect(result.current.loading).toBe(true);

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  // Should fetch real data through client
  expect(result.current.count).toBe(5);
  expect(result.current.liked).toBe(false);
});
```

3. **Mock pattern for data layer clients**:
```typescript
vi.mock('../../../data/clients/socialClient', () => ({
  socialClient: {
    getLikeCount: vi.fn(() => Promise.resolve({ success: true, data: 5 })),
    hasUserLiked: vi.fn(() => Promise.resolve({ success: true, data: false })),
    toggleLike: vi.fn(() => Promise.resolve({ success: true, data: undefined }))
  }
}));
```

## Data Transformation Patterns

### Type Mapping Between Legacy and New Data Layer

```typescript
// Legacy type
interface WiggEntry {
  id: string;
  pct: number;
  note?: string;
  createdAt: string;
  rating?: number;
}

// New data layer type
interface WiggPoint {
  id: string;
  pos_value: number;
  reason_short: string | null;
  created_at: string;
  // ... other fields
}

// Transformation function
const transformWiggPoint = (point: WiggPoint): WiggEntry => ({
  id: point.id,
  pct: point.pos_value,
  note: point.reason_short || undefined,
  createdAt: point.created_at,
  rating: undefined
});
```

## Client Module Patterns

### Standardized Error Handling

```typescript
// Data layer client method
export const socialClient = {
  getLikeCount: async (pointId: string): Promise<DataLayerResponse<number>> => {
    try {
      const { data, error } = await supabase.rpc('get_wigg_point_like_count', { point_id: pointId });

      if (error) return handleError(error);
      return handleSuccess(data);
    } catch (error) {
      return handleError(error);
    }
  }
};

// Usage in hook
const count = likeCountQuery.data?.success ? likeCountQuery.data.data : 0;
```

## Migration Checklist

### For Each Hook Migration:

- [ ] **Interface Analysis**: Document exact legacy hook interface
- [ ] **Test Creation**: Write failing test for interface compatibility
- [ ] **Client Integration**: Identify which data layer client to use
- [ ] **Query Setup**: Replace useState/useEffect with useQuery/useMutation
- [ ] **Data Transformation**: Add compatibility layer for data format differences
- [ ] **Error Handling**: Integrate with DataLayerResponse pattern
- [ ] **Loading States**: Coordinate multiple query loading states
- [ ] **Test Verification**: Ensure all tests pass with real data integration

### For New Feature Development:

- [ ] **Start with Data Layer**: Use new patterns from the beginning
- [ ] **Client First**: Define client methods before hooks
- [ ] **TanStack Query**: Use useQuery/useMutation for all data operations
- [ ] **Type Safety**: Leverage TypeScript throughout the data flow
- [ ] **Test Coverage**: Write comprehensive tests for both success and error cases

## Coexistence Strategy

During the migration period, both patterns can coexist seamlessly due to interface compatibility. This enables gradual migration without disrupting existing functionality.

### Simple Coexistence Example

```typescript
// Component can use either hook with identical interfaces
const WiggPointsComponent = ({ titleId }: { titleId: string }) => {
  // Feature flag determines which pattern to use
  const useNewDataLayer = useFeatureFlag('data-layer-migration');

  // Both hooks have identical interfaces!
  const legacyData = useUserWiggs(titleId, { enabled: !useNewDataLayer });
  const newData = useUserWiggsDataLayer(titleId, { enabled: useNewDataLayer });

  // Select active data source
  const data = useNewDataLayer ? newData : legacyData;

  // Component code is IDENTICAL regardless of data source
  return (
    <div>
      {data.isLoading ? (
        <div>Loading...</div>
      ) : data.error ? (
        <div>Error: {data.error.message}</div>
      ) : (
        <div>
          <p>Found {data.data?.entries.length || 0} wigg points</p>
          {data.data?.entries.map(entry => (
            <div key={entry.id}>
              {entry.pct}% - {entry.note}
            </div>
          ))}
          <button onClick={() => data.addWigg(50, 'New point')}>
            Add Wigg Point
          </button>
        </div>
      )}
    </div>
  );
};
```

### Advanced Feature Flag Integration

```typescript
// Real-world feature flag integration
const SocialComponent = ({ pointId }: { pointId: string }) => {
  // Can be user-based, percentage rollout, or environment-based
  const useNewDataLayer = useFeatureFlag('social-data-layer', {
    userId: user?.id,
    defaultValue: false
  });

  const legacySocial = useWiggLikes(pointId, { enabled: !useNewDataLayer });
  const newSocial = useWiggLikesDataLayer(pointId, { enabled: useNewDataLayer });

  const social = useNewDataLayer ? newSocial : legacySocial;

  return (
    <div className="social-controls">
      <button
        onClick={social.toggleLike}
        className={social.liked ? 'liked' : ''}
        disabled={social.loading}
      >
        {social.liked ? '❤️' : '🤍'} {social.count}
      </button>
      <button onClick={social.refreshCount} disabled={social.loading}>
        Refresh
      </button>

      {/* Debug info showing which system is active */}
      <div className="debug-info">
        Using: {useNewDataLayer ? 'New Data Layer' : 'Legacy System'}
      </div>
    </div>
  );
};
```

### Team-Based Migration Strategy

```typescript
// Different teams can migrate at different rates
const MultiTeamComponent = () => {
  return (
    <>
      {/* Team A: Fully migrated */}
      <TeamAFeature useNewDataLayer={true} />

      {/* Team B: In migration (50% rollout) */}
      <TeamBFeature useNewDataLayer={Math.random() > 0.5} />

      {/* Team C: Legacy (0% rollout) */}
      <TeamCFeature useNewDataLayer={false} />
    </>
  );
};
```

### Benefits of Coexistence Strategy

✅ **Zero Breaking Changes**: Interface compatibility ensures existing components work unchanged

✅ **Gradual Rollout**: Can migrate user-by-user, feature-by-feature, or team-by-team

✅ **A/B Testing**: Compare performance and reliability between old and new systems

✅ **Risk Mitigation**: Easy rollback by changing feature flag if issues discovered

✅ **Learning Opportunity**: Team members can adopt new patterns without pressure

✅ **Parallel Development**: Teams can continue building features while migration happens

### Real Production Example

Here's how the migration might look in production:

```typescript
// Week 1: Start with 5% of users on new system
const ROLLOUT_PERCENTAGE = 5;

// Week 2: Increase to 25% after validation
const ROLLOUT_PERCENTAGE = 25;

// Week 3: 75% on new system
const ROLLOUT_PERCENTAGE = 75;

// Week 4: 100% migration complete
const ROLLOUT_PERCENTAGE = 100;

const ProductionComponent = ({ userId, titleId }: Props) => {
  const useNewDataLayer = useMemo(() => {
    // Consistent assignment based on user ID hash
    const userHash = hashUserId(userId);
    return (userHash % 100) < ROLLOUT_PERCENTAGE;
  }, [userId]);

  // Rest of component uses either system transparently
  const data = useNewDataLayer
    ? useUserWiggsDataLayer(titleId)
    : useUserWiggs(titleId);

  return <WiggDisplay data={data} />;
};
```

This approach allows for:
- **Gradual migration** without breaking existing functionality
- **A/B testing** between old and new implementations
- **Easy rollback** if issues are discovered
- **Team learning** with new patterns while legacy code remains stable
- **Metrics collection** to validate improved performance
- **Risk reduction** through incremental adoption

## Next Steps

1. **Phase 2C**: Begin migrating components to use new data layer hooks
2. **Phase 3A**: Deprecate legacy service layer modules
3. **Phase 3B**: Remove legacy patterns after full migration
4. **Phase 4**: Optimize and enhance new data layer based on production usage