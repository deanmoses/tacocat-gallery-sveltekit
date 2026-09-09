import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

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

        // Step 2: Wait for year album thumbnails to load (AJAX), then open the
        // newest year. The sidebar's "Latest Album" thumbnail is a day album, but
        // it sits outside <main> so scoping to the main landmark excludes it.
        const yearAlbum = await newestThumbnail(page);
        await expectImageLoaded(yearAlbum.image);
        await yearAlbum.link.click();

        // Step 3: Verify we're on a year album page (URL ends with year, not a deeper path)
        await expect(page).toHaveURL(/\/\d{4}$/, { timeout: 15000 });

        const dayAlbum = await newestThumbnail(page);
        await expectImageLoaded(dayAlbum.image);
        await dayAlbum.link.click();

        // Step 4: Verify we're on a day album page (URL ends with MM-DD pattern, not a media file)
        await expect(page).toHaveURL(/\/\d{2}-\d{2}$/, { timeout: 15000 });

        const media = await newestThumbnail(page);
        await expectImageLoaded(media.image);
        await media.link.click();

        // Step 5: Verify we're on a media detail page
        // URL should have a media filename
        await expect(page).toHaveURL(/\/\d{4}\/\d{2}-\d{2}\/[^/]+/, { timeout: 15000 });

        // Scoped to the photo region so the nav arrows can't match. Holds an
        // image whether the media is a photo or a video (a video renders its
        // poster frame there).
        const mainImage = page.getByRole('region', { name: 'Photo' }).getByRole('img');
        await expect(mainImage).toBeVisible({ timeout: 10000 });
        await expectImageLoaded(mainImage);

        // Step 6: Test next navigation
        const firstImageUrl = page.url();

        // The media page always renders a Next button, and it has an href here
        // because we navigated into the newest media of the album. Its accessible
        // name comes from the anchor's title attribute, since the label span is
        // empty when no title is passed.
        await page.getByRole('link', { name: 'Next', exact: true }).click();

        // Wait for navigation to complete - URL should change
        await page.waitForURL((url) => url.toString() !== firstImageUrl, { timeout: 15000 });

        // Verify we're still on a media detail page (different media)
        await expect(page).toHaveURL(/\/\d{4}\/\d{2}-\d{2}\/[^/]+/, { timeout: 10000 });

        // Verify the new image loads
        const nextImage = page.getByRole('region', { name: 'Photo' }).getByRole('img');
        await expect(nextImage).toBeVisible({ timeout: 10000 });
        await expectImageLoaded(nextImage);
    });
});

/**
 * The newest thumbnail in the page's main content: the link a user would click,
 * and the image displayed above it.
 *
 * Thumbnails are ordered newest first, and each renders two anchors: an
 * aria-hidden one around the image and a visible one holding the title. Only the
 * second has a link role, so there is exactly one link and one image per
 * thumbnail, in matching document order.
 *
 * `no-nth-methods` rules out `.first()`, so this waits for the collection to be
 * non-empty and then resolves it. That keeps the auto-waiting the rule is meant
 * to protect: by the time `all()` runs, the thumbnails are already rendered.
 */
async function newestThumbnail(page: Page): Promise<{ image: Locator; link: Locator }> {
    const main = page.getByRole('main');
    const links = main.getByRole('link');
    await expect(links).not.toHaveCount(0, { timeout: 15000 });
    const [link] = await links.all();
    const [image] = await main.getByTestId('thumbnail-image').all();
    return { image, link };
}

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
