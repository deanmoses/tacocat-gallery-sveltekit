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
    timeout: 30000,
    retries: process.env.CI ? 2 : 0,

    use: {
        // Use BASE_URL env var if set, otherwise default to local preview server
        baseURL: process.env.BASE_URL || 'http://localhost:4173',
        // Capture screenshot on failure
        screenshot: 'only-on-failure',
        // Record trace on first retry
        trace: 'on-first-retry',
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
