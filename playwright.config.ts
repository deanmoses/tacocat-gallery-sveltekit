import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration
 *
 * Supports two modes:
 * 1. Local development: `npm run test:e2e` - builds and serves locally
 * 2. Live deployment: `npm run test:e2e:staging` / `test:e2e:prod`
 *
 * Set BASE_URL env var to override the target URL.
 */
export default defineConfig({
    // E2E specs sit beside the code they exercise and are identified by
    // extension, not location: `.e2e.ts` for Playwright, `.spec.ts` for Vitest.
    // testDir only narrows the scan; the extension is what selects.
    testDir: './src',
    testMatch: '**/*.e2e.{ts,js}',

    // Generous, because a live environment means several network hops and the
    // specs walk real album data
    timeout: 60000,
    retries: process.env.CI ? 2 : 0,

    // Tests within a file run in parallel, not just files. Set while the suite
    // is small: turning it on later means re-reading every spec written under
    // the assumption that it had the browser to itself.
    fullyParallel: true,

    // A test.only left in a commit otherwise turns the suite into that one test
    // and CI still reports green
    forbidOnly: !!process.env.CI,

    // `github` puts failures on the commit as annotations; `html` is the report
    // the CI job uploads, and `open: 'never'` stops a local failure from
    // launching a browser and blocking the terminal.
    reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],

    use: {
        // Use BASE_URL env var if set, otherwise default to local preview server
        baseURL: process.env.BASE_URL || 'http://localhost:4173',
        // Capture screenshot on failure
        screenshot: 'only-on-failure',

        // A failure against a live deployment is often gone by the time it is
        // retried, so keep the trace from the attempt that actually failed.
        // `on-first-retry` would record nothing at all locally, where retries
        // are off.
        trace: 'retain-on-failure',

        // The site is entirely client-rendered, so every assertion is waiting on
        // a fetch that hasn't been made yet at the time it runs. Set once here
        // rather than per assertion, so a new spec inherits the wait instead of
        // remembering it -- and so a spec that needs a different one says why.
        navigationTimeout: 15000,
    },

    expect: {
        timeout: 15000,
    },

    // Stated rather than left to the default browser, so this and the browser
    // CI installs cannot drift apart, and so adding a second one later is an
    // entry in a list rather than a restructuring.
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

    // Only start local server if not testing against external URL
    webServer: process.env.BASE_URL
        ? undefined
        : {
              command: 'npm run build && npm run preview',
              port: 4173,
              reuseExistingServer: !process.env.CI,
          },
});
