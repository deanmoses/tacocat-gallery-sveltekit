/**
 * Helpers shared by the e2e specs.
 *
 * These live outside any one spec because thumbnails are the way into every
 * page below the root: any spec that navigates anywhere goes through them.
 *
 * Lint holds this file to the same locator rules as the specs. A helper is
 * exactly where a CSS selector would otherwise sit unread.
 */
import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

/** What the URL looks like at each level of the hierarchy */
export const YEAR_ALBUM_URL = /\/\d{4}$/;
export const DAY_ALBUM_URL = /\/\d{4}\/\d{2}-\d{2}$/;
export const MEDIA_URL = /\/\d{4}\/\d{2}-\d{2}\/[^/]+$/;

/**
 * Clicks into the newest album or media item on the page, having first checked
 * that its thumbnail rendered an image the browser could actually load.
 *
 * Awaiting the click does not mean the destination has rendered. Assert the URL
 * you expect to land on, which is also what says the thumbnail linked where it
 * should.
 */
export async function openNewestThumbnail(page: Page): Promise<void> {
    const thumbnail = await newestThumbnail(page);
    await expectImageLoaded(thumbnail.image);
    await thumbnail.link.click();
}

/**
 * An <img> in the DOM is not an image that loaded: a broken source renders an
 * element with no intrinsic size, which every visibility assertion still passes.
 * naturalWidth is what tells the two apart.
 */
export async function expectImageLoaded(imgLocator: Locator): Promise<void> {
    await expect(imgLocator).toHaveJSProperty('complete', true);
    const naturalWidth = await imgLocator.evaluate((img: HTMLImageElement) => img.naturalWidth);
    expect(naturalWidth).toBeGreaterThan(0);
}

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
