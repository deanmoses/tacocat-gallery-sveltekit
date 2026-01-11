import { test, expect } from '@playwright/test';

/**
 * Smoke test that navigates through the album hierarchy:
 * Home (root) → Year album → Day album → Image detail → Next image
 *
 * Works against any environment (localhost, staging, prod) via BASE_URL env var.
 * The site is heavily AJAX-based, so we wait for content to load.
 */
test.describe('Smoke test', () => {
    // Increase timeout for live environment with multiple network hops
    test.setTimeout(60000);

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
        // Thumbnails are in .thumbnail divs - scope to these to avoid hero images/logos
        const yearThumb = page.locator('.thumbnail').first();
        await expect(yearThumb).toBeVisible({ timeout: 15000 });

        // Verify year album thumbnail image loads
        const yearThumbImg = yearThumb.locator('img');
        await expect(yearThumbImg).toBeVisible({ timeout: 10000 });
        await expectImageLoaded(yearThumbImg);

        // Click on the first year album (the link inside the thumbnail)
        const yearAlbumLink = yearThumb.locator('a').first();
        await yearAlbumLink.click();

        // Step 3: Verify we're on a year album page (URL contains a year like /2024)
        await expect(page).toHaveURL(/\/20\d{2}/, { timeout: 15000 });

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

        // Step 4: Verify we're on a day album page (URL contains MM-DD pattern)
        await expect(page).toHaveURL(/\/\d{2}-\d{2}/, { timeout: 15000 });

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
        await expect(page).toHaveURL(/\/20\d{2}\/\d{2}-\d{2}\/[^/]+/, { timeout: 15000 });

        // Verify main image loads
        const mainImage = page.locator('img').first();
        await expect(mainImage).toBeVisible({ timeout: 10000 });
        await expectImageLoaded(mainImage);

        // Step 6: Test next navigation
        // Since we clicked the first image, "next" should be available
        const firstImageUrl = page.url();

        // Find and click the next button/link
        // Look for common next navigation patterns
        const nextButton = page
            .locator('a[href*="next"], a:has-text("Next"), a:has-text("›"), [aria-label*="next" i], a[rel="next"]')
            .first();

        // If no explicit next button, try keyboard navigation
        if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await nextButton.click();
        } else {
            // Try right arrow key for image navigation
            await page.keyboard.press('ArrowRight');
        }

        // Wait for navigation to complete - URL should change
        await page.waitForURL((url) => url.toString() !== firstImageUrl, { timeout: 15000 });

        // Verify we're still on an image detail page (different image)
        await expect(page).toHaveURL(/\/20\d{2}\/\d{2}-\d{2}\/[^/]+/, { timeout: 10000 });

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
async function expectImageLoaded(imgLocator: import('@playwright/test').Locator) {
    // Wait for the image to fully load
    await expect(imgLocator).toHaveJSProperty('complete', true);
    // Verify the image has actual dimensions (not a broken image)
    const naturalWidth = await imgLocator.evaluate((img: HTMLImageElement) => img.naturalWidth);
    expect(naturalWidth).toBeGreaterThan(0);
}
