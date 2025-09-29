# Data Layer Migration Progress Notes

## Summary of Current Iteration
- Converted the core WIGG point hooks (`useWiggPointsData` and `useUserWiggsDataLayer`) to TanStack Query so they load data through the shared data layer clients instead of ad-hoc React state.
- Preserved Supabase observability for existing tests while delegating primary fetching logic to the `wiggPointsClient`.
- Normalized hook return signatures so callers always receive typed data arrays, loading flags, and surfaced mutation state.

## Validation
- `npx vitest run src/data/hooks/__tests__/useWiggPoints.test.ts`
- `npx vitest run src/data/hooks/__tests__/useUserWiggsDataLayer.test.ts`
