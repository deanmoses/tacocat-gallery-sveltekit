/**
 * @file Checks the JavaScript and CSS bundle size to catch performance regressions.
 *
 * @see docs/performance_optimization.md for performance guidelines
 */

import { test as it, expect, type Response } from '@playwright/test';

/**
 * Bundle size thresholds for performance regression detection
 * Thresholds set with a small buffer from the existing sizes,
 * to catch even relatively minor regressions
 */
const BUNDLE_SIZE_THRESHOLDS = {
    /** Critical resources: CSS and essential JS needed for first paint */
    CRITICAL_RESOURCES_KB: 8,
    /** Total guest bundle: All resources for full page interactivity */
    TOTAL_BUNDLE_KB: 130,
} as const;

/** Response data structure for tracking network requests */
interface ResponseData {
    /** Filename extracted from URL for cleaner logging */
    url: string;
    /** Complete URL of the resource */
    fullUrl: string;
    /** Playwright response object */
    response: Response;
}

/** File detail structure for bundle analysis */
interface FileDetail {
    /** Filename of the resource */
    file: string;
    /** Size in kilobytes, formatted as string */
    sizeKB: string;
    /** Whether this resource is critical for first paint */
    critical: boolean;
}

it('should not exceed bundle size thresholds for guest day route', async ({ page }) => {
    const responses: ResponseData[] = [];

    // Track all JavaScript and CSS responses from the app bundle
    page.on('response', (response) => {
        const url = response.url();
        if (url.includes('/_app/') && (url.endsWith('.js') || url.endsWith('.css'))) {
            responses.push({
                url: url.split('/').pop() || '', // Extract filename for cleaner logs
                fullUrl: url,
                response: response,
            });
        }
    });

    // Navigate to a representative day route and wait for all resources
    console.log('Navigating to day route...');
    await page.goto('/2024/01-15');
    await page.waitForLoadState('networkidle');

    // Process all captured responses and calculate bundle sizes
    let totalSize = 0;
    let criticalSize = 0;
    const fileDetails: FileDetail[] = [];

    for (const item of responses) {
        try {
            const buffer = await item.response.body();
            const size = buffer.length;
            totalSize += size;

            // Classify resources as critical (needed for first paint) or lazy-loaded
            // Critical: CSS files and main app/start bundles
            // Non-critical: Lazy-loaded chunks and optional features
            const isCritical = item.url.includes('app-') || item.url.includes('start-') || item.url.endsWith('.css');

            if (isCritical) {
                criticalSize += size;
            }

            fileDetails.push({
                file: item.url,
                sizeKB: (size / 1024).toFixed(2),
                critical: isCritical,
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.log(`Could not get size for ${item.url}:`, errorMessage);
        }
    }

    // Log detailed breakdown
    console.log('\n=== BUNDLE SIZE ANALYSIS ===');
    console.log(`Critical resources: ${(criticalSize / 1024).toFixed(2)} KB`);
    console.log(`Total bundle size: ${(totalSize / 1024).toFixed(2)} KB`);
    console.log(`Files loaded: ${responses.length}`);

    console.log('\n=== FILE BREAKDOWN ===');
    fileDetails
        .sort((a, b) => parseFloat(b.sizeKB) - parseFloat(a.sizeKB))
        .forEach((file) => {
            const criticalFlag = file.critical ? '[CRITICAL]' : '[LAZY]';
            console.log(`${criticalFlag} ${file.file}: ${file.sizeKB} KB`);
        });

    // Extract thresholds for assertion
    const { CRITICAL_RESOURCES_KB, TOTAL_BUNDLE_KB } = BUNDLE_SIZE_THRESHOLDS;

    console.log(`\n=== THRESHOLD CHECK ===`);
    console.log(`Critical threshold: ${CRITICAL_RESOURCES_KB} KB (actual: ${(criticalSize / 1024).toFixed(2)} KB)`);
    console.log(`Total threshold: ${TOTAL_BUNDLE_KB} KB (actual: ${(totalSize / 1024).toFixed(2)} KB)`);

    // Assert that bundle sizes remain within acceptable thresholds
    expect(
        criticalSize / 1024,
        `Critical resources exceed ${CRITICAL_RESOURCES_KB}KB threshold. See docs/performance_optimization.md for guidelines.`,
    ).toBeLessThan(CRITICAL_RESOURCES_KB);
    expect(
        totalSize / 1024,
        `Total bundle exceeds ${TOTAL_BUNDLE_KB}KB threshold. See docs/performance_optimization.md for guidelines.`,
    ).toBeLessThan(TOTAL_BUNDLE_KB);
});
