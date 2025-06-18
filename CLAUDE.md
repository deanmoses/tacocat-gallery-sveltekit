# tacocat-gallery-sveltekit Project Context

## Commands

- **Dev**: `npm run dev`
- **Build**: `npm run build`
- **Test**: `npm run test` (runs both unit and e2e tests)
- **Unit Tests**: `npm run test:unit`
- **E2E Tests**: `npm run test:e2e`
- **Lint**: `npm run lint`
- **Type Check**: `npm run check`
- **Format**: `npm run format`

## Tech Stack

- SvelteKit with TypeScript
- Svelte 5
- Vite for bundling
- Playwright for E2E testing
- Vitest for unit testing
- ESLint + Prettier for code quality

## Project Structure

- `src/lib/components/` - Reusable Svelte components
- `src/lib/models/` - TypeScript interfaces and data models
- `src/lib/state/` - State machines and stores
- `src/lib/utils/` - Utility functions
- `src/routes/` - SvelteKit route definitions
- `tests/` - Test files and test data
- `docs/` - Project documentation

## Code Style

- Use TypeScript for all new files
- Follow existing Svelte component patterns
- State management uses custom state machines in `src/lib/state/`
- Components are organized by domain (admin, album, image, search, site)
- Use composition, not inheritance
- Use semantic HTML and accessible markup

## Dependencies

- Node.js >= 23.5.0 required
- Uses npm for package management
- No external UI library - custom component system
- No external CSS system - custom CSS

## Deployment

- Staging: `npm run deploy-staging` → https://staging-pix.tacocat.com/
- Production: `npm run deploy-prod` → https://pix.tacocat.com/

## Claude Code Configuration

This project is optimally configured for Claude Code with comprehensive documentation and workflows:

- **Setup Guide**: @docs/claude.md - Complete configuration and usage guide
- **Plan Management**: Use `/plan`, `/implement`, `/review` commands for structured development
- **Testing Integration**: Automated workflow following @docs/ai_assistant_workflow.md
- **Project Documentation**: All docs available via `mdc:` links in Cursor rules

See @docs/claude.md for detailed setup instructions and best practices.
