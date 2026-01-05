# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run build-debug  # Build with sourcemaps, no minification
npm run preview      # Preview built app
npm run test         # Run Playwright E2E tests
npm run check        # Type checking (svelte-check + TypeScript)
npm run lint         # ESLint + Prettier check
npm run format       # Auto-format with Prettier
npm run deploy-staging  # Deploy to staging (S3 + CloudFront)
npm run deploy-prod     # Deploy to production
```

Requires Node.js >=24.0.0 (enforced).

## Tech Stack

- **SvelteKit 2** with Svelte 5 - Static adapter (SPA mode, SSR disabled)
- **Vite 6** - Dev server proxies `/api/*` to backend
- **TypeScript** - Strict mode enabled
- **Immer** - Immutable state updates via `produce()`
- **Quill** - Rich text editing for descriptions
- **Playwright** - E2E testing

## Architecture

### Routing

- `/` - Root album (all photos)
- `/[year]/` - Year album
- `/[year]/[day]/` - Day album (MM-DD format)
- `/[year]/[day]/[image]/` - Image detail view
- `/admin/` - Admin panel (auth required)

### State Management Pattern

Stores follow strict separation between **state transition methods** and **service methods**:

1. **State Transition Methods** (public)

    - Synchronous, return `void`
    - Only way to update state
    - May fire-and-forget async work
    - Use Svelte 5's `$state` and `$derived`

2. **Service Methods** (private)
    - Async, do actual work (fetch, save)
    - Call state transition methods when complete
    - Never mutate state directly

### Key Stores

- `SessionStore` - Authentication state
- `AlbumState` - Global album/image state
- `AlbumLoadMachine` - Album fetching state machine
- Admin state machines: `UploadMachine`, `AlbumCreateMachine`, `AlbumDeleteMachine`, `AlbumRenameMachine`, `ImageDeleteMachine`, `ImageRenameMachine`, `CropMachine`, `DraftMachine`

### Data Models

Located in `/src/lib/models/impl/`. Pure data structures (no fetching/persistence):

- Album types: ROOT, YEAR, DAY
- `AlbumCreator` factory converts server JSON to model instances
- Strict path validation via regex in `galleryPathUtils.ts`

### Gallery Path System

- Album paths: `/`, `/2001/`, `/2001/12-31/`
- Image paths: `/2001/12-31/image.jpg` (only in day albums)
- Path validation and sanitization enforced throughout

## API Integration

- Dev: Vite proxies `/api/*` to staging backend
- Staging: `https://api.staging-pix.tacocat.com/`
- Production: `https://api.pix.tacocat.com/`

Key endpoints:

- `GET /album[path]` - Fetch album
- `PUT/PATCH/DELETE /album[path]` or `/image[path]` - CRUD
- `POST /presigned[path]` - S3 upload URLs

Album data cached in IndexedDB with network fallback.

## Authentication

- Cognito-hosted login via redirect
- Session cookies with `credentials: 'include'`
- `FAKE_ADMIN_ON_DEV = true` in `SessionStore` simulates admin locally
- Auth endpoints at `https://auth.pix.tacocat.com/`

## Code Conventions

- 4-space indentation, 120 char lines, single quotes
- `.svelte.ts` files for Svelte stores/state machines
- PascalCase components, camelCase utilities

## Tools & CI

- **gh CLI**: Claude (and scripts) have read-write access to the `gh` CLI tool. Use it for GitHub operations instead of the GitHub MCP server.
- **Pre-commit hooks**: Husky runs gitleaks (secret scanning), lint-staged, type checking, and unit tests on commit. To bypass when needed: `git commit --no-verify`
- **Gitleaks**: Secret scanner runs on pre-commit. Install with `brew install gitleaks`. The hook warns but continues if gitleaks is not installed.

## Branch Protection

The `main` branch is protected:

- Requires PR before merging (no direct pushes)
- Requires status checks to pass
- Does NOT require reviews
- Does NOT require branches to be up to date

Repo settings:

- Auto-delete head branches after merge
