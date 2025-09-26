# Data Layer Architecture

The data layer lives under `src/data` and provides a typed façade for all network
operations. Code in components, pages, and other UI modules should consume the
TanStack Query hooks and service functions exported from this package instead of
calling `fetch`/`axios` or importing Supabase clients directly.

## Directory Layout

```
src/data
├── clients/        # Low-level HTTP clients (e.g., typed fetch wrappers)
├── hooks/          # React hooks powered by TanStack Query
├── mappers/        # DTO → domain mapping helpers
├── schemas/        # Zod schemas for request/response validation
├── services/       # Business operations orchestrating clients/mappers
└── index.ts        # Barrel export
```

## Usage in UI Code

```tsx
import { useWiggPoints, useCreateWiggPoint } from '@/data';

const { data: wiggs = [] } = useWiggPoints({ limit: 20 });
const createWigg = useCreateWiggPoint();

createWigg.mutateAsync({
  mediaTitle: 'Example',
  mediaType: 'game',
  posKind: 'min',
  posValue: 10,
  spoilerLevel: '0',
  reasonShort: null,
  tags: [],
  userId: currentUser.id,
});
```

The hooks handle caching, optimistic updates, and request validation via Zod.

## ESLint Enforcement

UI modules under `src/components`, `src/pages`, and `src/App.tsx` may no longer
call `fetch`/`axios` directly. The flat ESLint config emits an error if those
APIs are used. Data-fetching code must live in `src/data` or deeper services.

## Tests & Tooling

- MSW is configured in `tests/msw/server.ts`. The setup file `vitest.setup.ts`
  registers the server automatically so every test suite can opt-in with
  `mswServer.use(...)` handlers.
- End-to-end service tests live in `src/data/__tests__/wiggPoints.service.test.tsx`.
  These validate zod parsing, optimistic updates, and caching behaviour.

## Codemod

A helper codemod assists in migrating existing `fetch` calls to the shared
`apiClient`.

```bash
npx tsx scripts/codemods/migrate-fetch-to-data-layer.ts "src/**/*.tsx"
```

The codemod replaces simple `fetch` calls with `apiClient.request` scaffolding,
adds the necessary imports, and annotates the schema field with a TODO marker.
Manual review is still required to plug in the correct Zod schema and to move
the implementation into an appropriate service or hook.
