import { defineConfig } from '@playwright/test';

/**
 * Playwright configuration
 *
 * Supports two modes:
 * 1. Local development: `npm run test:e2e` - builds and serves locally
 * 2. Staging smoke test: `npm run test:e2e:staging` - tests against staging URL
 *
 * Set BASE_URL env var to override the target URL.
 */
export default defineConfig({
    testDir: './tests',

    // Generous, because a live environment means several network hops and the
    // specs walk real album data
    timeout: 60000,
    retries: process.env.CI ? 2 : 0,

    // A test.only left in a commit otherwise turns the suite into that one test
    // and CI still reports green
    forbidOnly: !!process.env.CI,

    use: {
        // Use BASE_URL env var if set, otherwise default to local preview server
        baseURL: process.env.BASE_URL || 'http://localhost:4173',
        // Capture screenshot on failure
        screenshot: 'only-on-failure',
        // Record trace on first retry
        trace: 'on-first-retry',

        // The site is entirely client-rendered, so every assertion is waiting on
        // a fetch that hasn't been made yet at the time it runs. Set once here
        // rather than per assertion, so a new spec inherits the wait instead of
        // remembering it -- and so a spec that needs a different one says why.
        navigationTimeout: 15000,
    },

    expect: {
        timeout: 15000,
    },

    // Only start local server if not testing against external URL
    webServer: process.env.BASE_URL
        ? undefined
        : {
              command: 'npm run build && npm run preview',
              port: 4173,
              reuseExistingServer: !process.env.CI,
          },
});
