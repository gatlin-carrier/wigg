# Repository Guidelines

## Project Structure & Module Organization
- `src/`: Main React + TypeScript app (components, pages, hooks, lib, contexts, integrations).
- `apps/web` and `apps/native`: Platform-specific entry points and examples.
- `packages/shared`: Reusable modules (e.g., `@shared/wigg/*`) used across apps.
- `public/`: Static assets served by Vite.
- `docs/`: Project notes and feature docs.
- `dist/`: Build output (ignored by lint and VCS).

## Build, Test, and Development Commands
- `npm run dev`: Start Vite dev server with HMR.
- `npm run build`: Production build to `dist/`.
- `npm run build:dev`: Development-mode build for faster iteration.
- `npm run preview`: Serve the built app locally.
- `npm run lint`: Run ESLint on the project.
- `npm test`: Run Vitest once (CI-friendly). For watch mode, run `npx vitest`.

## Coding Style & Naming Conventions
- **Language**: TypeScript, React (SWC), Tailwind.
- **Linting**: ESLint per `eslint.config.js` (React Hooks and Refresh rules enabled; `dist/` ignored). Fix reported issues before PR.
- **Imports**: Use aliases `@/*` for `src/*` and `@shared/*` for `packages/shared/*`.
- **Components**: PascalCase filenames (e.g., `WiggPointsList.tsx`).
- **Hooks**: camelCase starting with `use` (e.g., `useAuth.tsx`).
- **Tests**: colocate under `__tests__` with `.test.ts(x)` suffix.

## Testing Guidelines
- **Frameworks**: Vitest + Testing Library (`jsdom` env; see `vitest.config.ts`).
- **Locations**: `src/**/__tests__`, `packages/**/__tests__`, `apps/**/__tests__`.
- **Conventions**: Prefer user-facing tests via Testing Library; mock APIs where needed. Keep tests deterministic.
- **Running**: `npm test` for a single run; `npx vitest` for watch.

## Commit & Pull Request Guidelines
- **Commits**: Prefer Conventional Commits (`feat:`, `fix:`, `refactor:`) as seen in history; keep messages scoped and imperative.
- **PRs**: Include a clear summary, linked issues, and UI screenshots for visible changes. Ensure `npm run lint` and tests pass locally.

## Security & Configuration Tips
- **Environment**: Store secrets in `.env` (e.g., Supabase keys); never commit secrets. Review `supabase/` for related config.
- **Data**: Avoid committing large assets; place runtime assets in `public/`.

## Architecture Overview
- Vite + React + Tailwind UI with shadcn components. Shared logic lives in `packages/shared` (e.g., Wigg data utilities) and is imported via path aliases.

## MCP Config 
C:\Users\gatli\.codex\config.toml
