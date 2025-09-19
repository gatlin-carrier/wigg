## TDD Fundamentals

### The TDD Cycle
1. **Red Phase**: Write ONE failing test that describes desired behavior
   - The test must fail for the RIGHT reason (not syntax/import errors)
   - Only one test at a time - this is critical for TDD discipline
   - **Adding a single test to a test file is ALWAYS allowed** - no prior test output needed
   - Starting TDD for a new feature is always valid, even if test output shows unrelated work
2. **Green Phase**: Write the minimal code required to make the current failing test pass
   - Minimal means "no extra features", not "ignore established quality". When evidence shows the full behavior (existing functions, TODO comments, specs), implement the complete requirement in one step.
   - Match established patterns for error handling, branching, and integration when they already exist in the file or module.
3. **Refactor Phase**: Improve code structure while keeping tests green
   - Only allowed when relevant tests are passing
   - Requires proof that tests have been run and are green
   - Applies to BOTH implementation and test code
   - No refactoring with failing tests - fix them first

### Core Violations
1. **Multiple Test Addition**
   - Adding more than one new test at once
   - Exception: Initial test file setup or extracting shared test utilities
2. **Over-Implementation**
   - Code that exceeds what's needed to satisfy documented requirements or patterns
   - Adding untested features or entirely new capabilities that lack evidence
   - Implementing multiple methods when the test or requirement only calls for one
3. **Premature Implementation**
   - Adding implementation before a test exists and fails properly
   - Adding implementation without running the test first (unless addressing TODO evidence)
   - Refactoring when tests haven't been run or are failing

### Evidence-Based Integration Exceptions
- Existing, working code in the same module is valid evidence. If `searchManga()` already exists, adding `searchAnime()` with the same shape, error handling, and integration is allowed.
- TODO or FIXME comments that explicitly describe required behavior count as requirements. Replacing `throw new Error('not implemented')` under such a TODO with the real implementation is permissible.
- Documentation, specs, or comments describing the contract count as evidence when they are concrete (e.g., "TODO: Implement AniList GraphQL integration").
- Integrations that connect existing systems (importing and wiring up an already exported function such as `searchPodcasts()`) should be treated as permissive scenarios, provided no entirely new surface area is introduced.
- When using an exception, reference the evidence in your reasoning (e.g., cite the TODO or existing function).

### Pattern-Following Implementation Guidance
- If a file already contains multiple functions or branches that follow a clear pattern, adding a new variant that mirrors that pattern (including switch statements, branching, or error handling) is considered minimal.
- Matching existing analytics, logging, or error-reporting patterns is encouraged. Replacing `console.log` with an established analytics client is acceptable when the client already exists.
- Configuration or infrastructure updates that align with current conventions (e.g., adding routing rules, analytics endpoints, feature flags) are permitted when they extend existing setups.

### Minimal Implementation Checklist
- Satisfies the current failing test or documented requirement without introducing unrelated features.
- Reuses existing helpers, types, and error handling when available.
- Avoids speculative branches or API calls that are not covered by tests, TODOs, or documentation.
- Keeps control flow as simple as the established pattern allows (no unnecessary abstractions, but do not remove warranted structure).

### Security Refactoring Exception
Security-related refactoring that removes exposed secrets or improves security posture is allowed when:
- Tests are currently passing (green state) OR test output shows recent successful test run
- The change maintains the same external API behavior
- The change removes security vulnerabilities (e.g., exposed API keys, VITE_ prefixed secrets)
- The refactoring doesn't add new functionality, only improves security
- CRITICAL: When test output shows "76 passed" or similar successful runs, this satisfies the green state requirement

### Configuration and Infrastructure Changes
- Follow the same evidence rules: existing configs, TODOs, or docs establish the requirement.
- Replacing placeholders or no-op analytics with actual integrations is allowed when the analytics client already exists.
- For new services, start with tests or TODOs before implementing the configuration.

### General Information
- Sometimes the test output shows as no tests have been run when a new test is failing due to a missing import or constructor. In such cases, allow the agent to create simple stubs. Ask them if they forgot to create a stub if they are stuck.
- It is never allowed to introduce brand new logic without evidence of relevant failing tests or requirements. However, stubs and simple implementation to make imports and test infrastructure work is fine.
- In the refactor phase, it is perfectly fine to refactor both tests and implementation code. That said, completely new functionality is not allowed. Types, clean up, abstractions, and helpers are allowed as long as they do not introduce new behavior beyond the documented requirements.
- Adding types, interfaces, or constants to replace magic values is perfectly fine during refactoring.
- Provide the agent with helpful directions so that they do not get stuck when blocking them.
