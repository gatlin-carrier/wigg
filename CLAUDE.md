# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start Vite development server on port 8080
- `npm run build` - Build production bundle
- `npm run build:dev` - Build development bundle
- `npm run lint` - Run ESLint on all files
- `npm run test` - Run Vitest test suite
- `npm run preview` - Preview production build

## Project Architecture

This is a React + TypeScript application using Vite as build tool and Supabase as backend. The project follows a monorepo structure with shared packages.

### Core Structure

- **Root**: Main web application (Vite + React + TypeScript)
- **`apps/web/`**: Web-specific components (WiggMap visualization)
- **`apps/native/`**: React Native components (WiggMap.native)
- **`packages/shared/`**: Cross-platform shared code
- **`src/`**: Main application source with pages, components, hooks
- **`supabase/`**: Database migrations and functions

### Key Technologies

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, RLS, auth)
- **State Management**: TanStack Query, custom Auth context
- **Testing**: Vitest, Testing Library, jsdom environment
- **Build**: Vite with SWC plugin

### Database Schema

Core entities stored in Supabase:
- `media` - Movies, TV, games, books, podcasts with metadata
- `episodes` - TV/podcast episodes linked to media
- `wigg_points` - User-submitted points of interest (with position, tags, spoiler levels)
- `profiles` - User profiles with trust scores and sensitivity settings
- `votes` - User votes on wigg points
- `flags` - User flags for inappropriate content
- `lists` - User curated lists of media

### WiggMap Component System

Specialized visualization components for showing "wigg points" (points of interest) across media timelines:

- **Shared logic**: `packages/shared/wigg/` contains types and curve computation
- **Web implementation**: `apps/web/src/components/wigg/WiggMap.tsx` (SVG-based)
- **Native implementation**: `apps/native/src/components/wigg/WiggMap.native.tsx`
- **Documentation**: `docs/wiggmap.md` has detailed usage and API

The system uses kernel density estimation to create smooth visualizations from discrete user-submitted points.

### Path Aliases

- `@/` → `src/`
- `@shared/` → `packages/shared/`

### Testing Configuration

Vitest configured to:
- Use jsdom environment
- Include tests from `packages/**/__tests__/` and `apps/**/__tests__/`
- Run setup file `vitest.setup.ts`

### Authentication & Database Access

Uses Supabase client with Row Level Security (RLS) policies. Auth context provides user state throughout the app.

## TDD Guard Guidelines

This project uses a TDD guard system to enforce test-driven development practices. Follow these guidelines to work effectively with the guard:

### Core TDD Workflow

1. **Red Phase**: Write ONE failing test that describes desired behavior
   - The test must fail for the RIGHT reason (not syntax/import errors)
   - Run the test to show specific failure output
   - Only one test at a time - this is critical for TDD discipline

2. **Green Phase**: Write minimal code to make the failing test pass
   - Show the failing test output before implementing
   - Implement only what's needed to satisfy the failing test
   - Match established patterns for error handling and integration

3. **Refactor Phase**: Improve code while keeping tests green
   - Only allowed when tests are currently passing
   - Requires proof that tests have been run and are green
   - No refactoring with failing tests - fix them first

### Evidence-Based Implementation Exceptions

The TDD guard allows implementation without failing tests when there's clear evidence:

#### Pattern-Following Implementation
- **Existing code patterns**: If `searchMovies()` exists, adding `searchGames()` with same error handling is allowed
- **Established integrations**: Connecting existing exported functions is permissible
- **Configuration updates**: Adding routing rules, analytics endpoints that extend existing setups

#### TODO/Documentation Evidence
- **TODO comments**: `// TODO: Implement Supabase persistence` counts as requirements
- **FIXME comments**: Replacing `throw new Error('not implemented')` under FIXME is allowed
- **Documentation**: Concrete specs describing the contract are valid evidence

#### Security and Bug Fixes
- **Security improvements**: Removing exposed secrets when tests are passing
- **Clear bug fixes**: When the bug is obvious and maintains same external API
- **Pattern matching**: Following existing error handling, logging, analytics patterns

### Working with Failing Tests

When you have failing tests, use this workflow:

```bash
# 1. Run the failing test to show output
npm run test -- path/to/test.ts --testNamePattern="specific test name"

# 2. Copy the failure output to demonstrate what needs to be implemented
# Example: "AssertionError: expected mockInsert to be called but got 0 calls"

# 3. Implement only what's needed to make that specific test pass
```

### Common TDD Guard Violations to Avoid

❌ **Multiple Test Addition**: Adding more than one test at once
❌ **Over-Implementation**: Code that exceeds test requirements
❌ **Premature Implementation**: Adding code before test fails properly
❌ **Speculative Features**: Adding untested capabilities

✅ **Single Focused Test**: One test that fails for specific reason
✅ **Minimal Implementation**: Just enough code to make test pass
✅ **Pattern Following**: Matching existing code structure and error handling
✅ **Evidence-Based**: TODO comments, existing patterns, or documentation

### Project-Specific Patterns

#### Supabase Integration Pattern
When implementing Supabase operations, follow this established pattern:
```typescript
// 1. Get current user
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  throw new Error('User not authenticated');
}

// 2. Perform database operation
const { data, error } = await supabase
  .from('table_name')
  .operation(params);

// 3. Handle errors
if (error) {
  throw error;
}
```

#### Hook Implementation Pattern
For data hooks, follow the established pattern in `useUserWiggs`:
- useState for data, loading, error states
- useEffect for data fetching
- Error handling with proper error messages
- Integration with existing TanStack Query patterns

#### Test Mocking Pattern
For Supabase tests, use this established mocking pattern:
```typescript
vi.mock('@/integrations/supabase/client', () => {
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: [...], error: null })
  };

  return {
    supabase: {
      from: vi.fn().mockReturnValue(mockQuery),
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test' } } }) }
    }
  };
});
```

Remember: The TDD guard is designed to maintain code quality. When blocked, examine if you have proper test evidence or if you're following established patterns in the codebase.


These examples should be used as guidance when configuring Sentry functionality within a project.

# Error / Exception Tracking

Use `Sentry.captureException(error)` to capture an exception and log the error in Sentry.
Use this in try catch blocks or areas where exceptions are expected

# Tracing Examples

Spans should be created for meaningful actions within an applications like button clicks, API calls, and function calls
Ensure you are creating custom spans with meaningful names and operations
Use the `Sentry.startSpan` function to create a span
Child spans can exist within a parent span

## Custom Span instrumentation in component actions

```javascript
function TestComponent() {
  const handleTestButtonClick = () => {
    // Create a transaction/span to measure performance
    Sentry.startSpan(
      {
        op: "ui.click",
        name: "Test Button Click",
      },
      (span) => {
        const value = "some config";
        const metric = "some metric";

        // Metrics can be added to the span
        span.setAttribute("config", value);
        span.setAttribute("metric", metric);

        doSomething();
      },
    );
  };

  return (
    <button type="button" onClick={handleTestButtonClick}>
      Test Sentry
    </button>
  );
}
```

## Custom span instrumentation in API calls

```javascript
async function fetchUserData(userId) {
  return Sentry.startSpan(
    {
      op: "http.client",
      name: `GET /api/users/${userId}`,
    },
    async () => {
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();
      return data;
    },
  );
}
```

# Logs

Where logs are used, ensure Sentry is imported using `import * as Sentry from "@sentry/react"`
Enable logging in Sentry using `Sentry.init({ enableLogs: true })`
Reference the logger using `const { logger } = Sentry`
Sentry offers a consoleLoggingIntegration that can be used to log specific console error types automatically without instrumenting the individual logger calls

## Configuration

### Baseline

```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://1d7d2b59db8d905cbc29aeecd9357528@o4510075357429760.ingest.us.sentry.io/4510075358674944",

  enableLogs: true,
});
```

### Logger Integration

```javascript
Sentry.init({
  dsn: "https://1d7d2b59db8d905cbc29aeecd9357528@o4510075357429760.ingest.us.sentry.io/4510075358674944",
  integrations: [
    // send console.log, console.warn, and console.error calls as logs to Sentry
    Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
  ],
});
```

## Logger Examples

`logger.fmt` is a template literal function that should be used to bring variables into the structured logs.

```javascript
logger.trace("Starting database connection", { database: "users" });
logger.debug(logger.fmt`Cache miss for user: ${userId}`);
logger.info("Updated profile", { profileId: 345 });
logger.warn("Rate limit reached for endpoint", {
  endpoint: "/api/results/",
  isEnterprise: false,
});
logger.error("Failed to process payment", {
  orderId: "order_123",
  amount: 99.99,
});
logger.fatal("Database connection pool exhausted", {
  database: "users",
  activeConnections: 100,
});
```
