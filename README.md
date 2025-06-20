# tacocat-gallery-sveltekit

Front end of the Tacocat photo gallery website using the [Sveltekit](https://kit.svelte.dev/) application framework.

## Installation

Clone this project, `cd` into its directory, install dependencies with `npm install` or `pnpm install` or `yarn`.

## Run Development Version

Start development server: `npm run dev`

## Deploy to Production

1. Create the production assets: `npm run build`

2. You can preview the build with `npm run preview`, though personally I haven't used this.

3. Deploy the build to staging with `npm run deploy-staging` and see results at https://staging-pix.tacocat.com/

4. Deploy the build to production with `npm run deploy-prod` and see results at https://pix.tacocat.com/

## More Info

- [Overall Architecture](docs/architecture.md)
- [Component Architecture](docs/component_architecture.md)
- [Development Workflow](docs/dev_workflow.md)
- [Development Environment](docs/dev_env.md)
- [Testing](docs/testing.md)
- [Using Claude Code](docs/claude.md)
