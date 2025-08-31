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