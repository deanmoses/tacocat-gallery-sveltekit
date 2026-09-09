import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

/**
 * Walks the album hierarchy the way a visitor does: root, into the newest year,
 * into the newest day, into a media item, then on to the next one.
 *
 * Runs against a real deployment -- localhost by default, staging or prod via
 * BASE_URL -- so it walks whatever albums are actually there and can make no
 * claim about specific content. What it covers is that the client-rendered app
 * boots, fetches, routes and renders images at every level.
 *
 * Timeouts live in playwright.config.ts. Nothing is present on load, so every
 * assertion here is waiting on a fetch.
 */
test.describe('Smoke test', () => {
    test('page includes noindex meta tag', async ({ page }) => {
        await page.goto('/');
        const robotsMeta = page.locator('meta[name="robots"][content="noindex"]');
        await expect(robotsMeta).toBeAttached();
    });

    test('navigate through album hierarchy', async ({ page }) => {
        await page.goto('/');

        // The title is set by the album fetch, so this is also the first
        // evidence that the app got a response at all
        await expect(page).toHaveTitle(/Moses|Family/i);

        const yearAlbum = await newestThumbnail(page);
        await expectImageLoaded(yearAlbum.image);
        await yearAlbum.link.click();

        // A year, not something deeper: proof the root album's thumbnails link
        // where they should
        await expect(page).toHaveURL(/\/\d{4}$/);

        const dayAlbum = await newestThumbnail(page);
        await expectImageLoaded(dayAlbum.image);
        await dayAlbum.link.click();

        await expect(page).toHaveURL(/\/\d{2}-\d{2}$/);

        const media = await newestThumbnail(page);
        await expectImageLoaded(media.image);
        await media.link.click();

        await expect(page).toHaveURL(/\/\d{4}\/\d{2}-\d{2}\/[^/]+/);

        // Scoped to the media region so the nav arrows can't match. Holds an
        // image whether the item is a photo or a video (a video renders its
        // poster frame there).
        const mainImage = page.getByRole('region', { name: 'Media' }).getByRole('img');
        await expect(mainImage).toBeVisible();
        await expectImageLoaded(mainImage);

        const firstImageUrl = page.url();

        // The media page always renders a Next button, and it has an href here
        // because we navigated into the newest media of the album. Its accessible
        // name comes from the anchor's title attribute, since the label span is
        // empty when no title is passed.
        await page.getByRole('link', { name: 'Next', exact: true }).click();

        // Routing between two media items in the same album is client-side, so
        // the URL changing is what says the navigation happened
        await page.waitForURL((url) => url.toString() !== firstImageUrl);
        await expect(page).toHaveURL(/\/\d{4}\/\d{2}-\d{2}\/[^/]+/);

        const nextImage = page.getByRole('region', { name: 'Media' }).getByRole('img');
        await expect(nextImage).toBeVisible();
        await expectImageLoaded(nextImage);
    });
});

/**
 * The newest thumbnail in the page's main content: the link a user would click,
 * and the image displayed above it.
 *
 * Both come from inside a single thumbnail rather than from two page-wide
 * queries, so they always describe the same album or media item. Querying
 * separately would pair them by position, which doesn't hold: a day album's
 * description sits in <main> ahead of the thumbnails and may contain its own
 * links, and a thumbnail with no thumbnail set renders a placeholder instead of
 * an <img>.
 *
 * Scoping to <main> also excludes the sidebar's "Latest Album" thumbnail, which
 * is a day album and would be reached from the root page instead of a year.
 *
 * `no-nth-methods` rules out `.first()`, so this waits for the collection to be
 * non-empty and then resolves it. That keeps the auto-waiting the rule is meant
 * to protect: by the time `all()` runs, the thumbnails are already rendered.
 */
async function newestThumbnail(page: Page): Promise<{ image: Locator; link: Locator }> {
    const thumbnails = page.getByRole('main').getByTestId('thumbnail');
    await expect(thumbnails).not.toHaveCount(0);
    // Thumbnails are ordered newest first
    const [thumbnail] = await thumbnails.all();
    // The image sits in an aria-hidden anchor, so the titled one is the only link
    return { image: thumbnail.getByTestId('thumbnail-image'), link: thumbnail.getByRole('link') };
}

/**
 * An <img> in the DOM is not an image that loaded: a broken source renders an
 * element with no intrinsic size, which every visibility assertion still passes.
 * naturalWidth is what tells the two apart.
 */
async function expectImageLoaded(imgLocator: Locator) {
    await expect(imgLocator).toHaveJSProperty('complete', true);
    const naturalWidth = await imgLocator.evaluate((img: HTMLImageElement) => img.naturalWidth);
    expect(naturalWidth).toBeGreaterThan(0);
}
