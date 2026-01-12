# tacocat-gallery-sveltekit

Front end of the Tacocat photo gallery website using the [Sveltekit](https://kit.svelte.dev/) application framework.

## Prerequisites

- **Node.js 24+**
- **gitleaks** (optional) - Secret scanner for pre-commit. Install via [gitleaks releases](https://github.com/gitleaks/gitleaks#installing). The pre-commit hook will warn but continue if not installed.

## Install

Clone this project, `cd` into its directory, install dependencies with `npm install`.

## Develop

```bash
npm run dev          # Start dev server.  It has a proxy API to the staging backend, so you'll get the staging gallery, photos, search
npm run quality      # Format, lint, and type check
npm run test:unit    # Run unit tests
npm run test:e2e     # Run end-to-end integration tests
```

## Commit

Commit runs a bunch of checks: secret scanning, lint, unit tests.

To commit to `main`, you must submit a PR.

When a PR is merged into `main`, the CI/CD system (GitHub Actions) automatically runs tests and deploys to staging. This overwrites anything you deployed to it manually (see below).

## Staging

Staging: <https://staging-pix.tacocat.com/>

Committing to `main` deploys to staging (described above). You can also do it manually, if you want to try things before committing:

```bash
npm run build           # Create production assets
npm run deploy-staging  # Deploy to https://staging-pix.tacocat.com/
```

## Production

Production: <https://pix.tacocat.com/>

To deploy:

1. On GitHub's website for this repo, go to [Actions](https://github.com/deanmoses/tacocat-gallery-sveltekit/actions) > [Deploy to Production](https://github.com/deanmoses/tacocat-gallery-sveltekit/actions/workflows/deploy-prod.yml)
2. Click "Run workflow" and select the main branch. The workflow:
    1. Runs tests
    2. Deploys to prod
    3. Creates a GitHub release (like 2027v2) with auto-generated release notes

## More Info

- [Architecture](docs/Architecture.md)
- [Component Architecture](docs/Component_Architecture.md)
- [Testing](docs/Testing.md)
- [Svelte 5 Patterns](docs/Svelte.md)
