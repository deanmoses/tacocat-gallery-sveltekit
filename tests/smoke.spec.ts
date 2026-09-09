import { test, expect } from '@playwright/test';
import type { Locator } from '@playwright/test';

/**
 * Smoke test that navigates through the album hierarchy:
 * Home (root) → Year album → Day album → Image detail → Next image
 *
 * Works against any environment (localhost, staging, prod) via BASE_URL env var.
 * The site is heavily AJAX-based, so we wait for content to load.
 */
test.describe('Smoke test', () => {
    // Increase timeout for live environment with multiple network hops
    test.describe.configure({ timeout: 60000 });

    test('page includes noindex meta tag', async ({ page }) => {
        await page.goto('/');
        const robotsMeta = page.locator('meta[name="robots"][content="noindex"]');
        await expect(robotsMeta).toBeAttached();
    });

    test('navigate through album hierarchy', async ({ page }) => {
        // Step 1: Navigate to home page
        await page.goto('/');

        // Verify page title (wait for AJAX to update it)
        await expect(page).toHaveTitle(/Moses|Family/i, { timeout: 15000 });

        // Step 2: Wait for year album thumbnails to load (AJAX)
        // Scope to .main-content to avoid sidebar's "Latest Album" thumbnail (which is a day album)
        const yearThumb = page.locator('.main-content .thumbnail').first();
        await expect(yearThumb).toBeVisible({ timeout: 15000 });

        // Verify year album thumbnail image loads
        const yearThumbImg = yearThumb.locator('img');
        await expect(yearThumbImg).toBeVisible({ timeout: 10000 });
        await expectImageLoaded(yearThumbImg);

        // Click on the first year album (the link inside the thumbnail)
        const yearAlbumLink = yearThumb.locator('a').first();
        await yearAlbumLink.click();

        // Step 3: Verify we're on a year album page (URL ends with year, not a deeper path)
        await expect(page).toHaveURL(/\/\d{4}$/, { timeout: 15000 });

        // Wait for day album thumbnails to load
        const dayThumb = page.locator('.thumbnail').first();
        await expect(dayThumb).toBeVisible({ timeout: 15000 });

        // Verify day album thumbnail image loads
        const dayThumbImg = dayThumb.locator('img');
        await expect(dayThumbImg).toBeVisible({ timeout: 10000 });
        await expectImageLoaded(dayThumbImg);

        // Click on the first day album
        const dayAlbumLink = dayThumb.locator('a').first();
        await dayAlbumLink.click();

        // Step 4: Verify we're on a day album page (URL ends with MM-DD pattern, not a media file)
        await expect(page).toHaveURL(/\/\d{2}-\d{2}$/, { timeout: 15000 });

        // Wait for image thumbnails to load
        const imageThumb = page.locator('.thumbnail').first();
        await expect(imageThumb).toBeVisible({ timeout: 15000 });

        // Verify image thumbnail loads
        const imgThumbImg = imageThumb.locator('img');
        await expect(imgThumbImg).toBeVisible({ timeout: 10000 });
        await expectImageLoaded(imgThumbImg);

        // Click on the first image
        const imageLink = imageThumb.locator('a').first();
        await imageLink.click();

        // Step 5: Verify we're on an image detail page
        // URL should have an image filename
        await expect(page).toHaveURL(/\/\d{4}\/\d{2}-\d{2}\/[^/]+/, { timeout: 15000 });

        // Verify main image loads
        const mainImage = page.locator('img').first();
        await expect(mainImage).toBeVisible({ timeout: 10000 });
        await expectImageLoaded(mainImage);

        // Step 6: Test next navigation
        const firstImageUrl = page.url();

        // The media page always renders a Next button, and it has an href here
        // because we navigated into the first image of the album. Its accessible
        // name comes from the anchor's title attribute, since the label span is
        // empty when no title is passed.
        await page.getByRole('link', { name: 'Next', exact: true }).click();

        // Wait for navigation to complete - URL should change
        await page.waitForURL((url) => url.toString() !== firstImageUrl, { timeout: 15000 });

        // Verify we're still on an image detail page (different image)
        await expect(page).toHaveURL(/\/\d{4}\/\d{2}-\d{2}\/[^/]+/, { timeout: 10000 });

        // Verify the new image loads
        const nextImage = page.locator('img').first();
        await expect(nextImage).toBeVisible({ timeout: 10000 });
        await expectImageLoaded(nextImage);
    });
});

/**
 * Verify that an image element has actually loaded its source.
 * Checks that naturalWidth > 0, which indicates the image data loaded successfully.
 */
async function expectImageLoaded(imgLocator: Locator) {
    // Wait for the image to fully load
    await expect(imgLocator).toHaveJSProperty('complete', true);
    // Verify the image has actual dimensions (not a broken image)
    const naturalWidth = await imgLocator.evaluate((img: HTMLImageElement) => img.naturalWidth);
    expect(naturalWidth).toBeGreaterThan(0);
}
