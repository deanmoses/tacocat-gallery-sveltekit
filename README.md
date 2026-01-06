# tacocat-gallery-sveltekit

Front end of the Tacocat photo gallery website using the [Sveltekit](https://kit.svelte.dev/) application framework.

## Prerequisites

- **Node.js 24+** - Install via [nvm](https://github.com/nvm-sh/nvm), [fnm](https://github.com/Schniz/fnm), or [nodejs.org](https://nodejs.org/)
- **gitleaks** (optional) - Secret scanner for pre-commit. Install via [gitleaks releases](https://github.com/gitleaks/gitleaks#installing). The pre-commit hook will warn but continue if not installed.

## Installation

Clone this project, `cd` into its directory, install dependencies with `npm install`.

## Run Development Version

Start development server: `npm run dev`

## Production

1. Create the production assets: `npm run build`
2. Deploy the build to staging with `npm run deploy-staging` and see results at <https://staging-pix.tacocat.com/>
3. Deploy the build to production with `npm run deploy-prod` and see results at <https://pix.tacocat.com/>

## More Info

- [Architecture](docs/Architecture.md)
- [Component Architecture](docs/Component_Architecture.md)
- [Testing](docs/Testing.md)
- [Svelte 5 Patterns](docs/Svelte.md)
