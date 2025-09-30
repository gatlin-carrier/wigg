# Monitoring & Build Tooling Interview Script

**Intro (0:00-0:10)**  
"Beyond features, I keep an eye on build tooling and monitoring so we catch issues early."

**Sentry Integration (0:10-0:35)**  
"`src/lib/monitoring/sentry.ts` wires up Sentry with environment, release, and console log capture, but only if `VITE_SENTRY_DSN` exists. That means developers can run locally without noise, while production captures breadcrumbs and PII safely via `sendDefaultPii`."

**Vite Configuration (0:35-0:55)**  
"In `vite.config.ts` we conditionally add the Sentry Vite plugin when the auth token and org/project are present, so source maps upload automatically on CI builds. We also predefine manual chunks—vendor, UI, query—to keep bundle sizes predictable."

**Testing Stack (0:55-1:15)**  
"`vitest.config.ts` aligns alias resolution with Vite, runs in jsdom, and includes a custom reporter (`tdd-guard-vitest`) that streams results back to the CLI. This keeps unit tests in sync with storybook stories and MSW handlers."

**Dev Experience (1:15-1:30)**  
"All of this means production builds get observability out of the box, developers aren’t slowed down locally, and our test matrix mirrors the runtime environment closely."

**Wrap (1:30-1:35)**  
"It’s the glue that helps us ship fast without flying blind."
