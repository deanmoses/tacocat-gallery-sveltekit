import { test, expect } from '@playwright/test';
import {
    DAY_ALBUM_URL,
    MEDIA_URL,
    YEAR_ALBUM_URL,
    expectImageLoaded,
    openNewestThumbnail,
} from '$lib/test-support/e2e/gallery';

test.describe('Smoke test', () => {
    test('page includes noindex meta tag', async ({ page }) => {
        await page.goto('/');
        const robotsMeta = page.locator('meta[name="robots"][content="noindex"]');
        await expect(robotsMeta).toBeAttached();
    });

    /**
     * Walks whatever albums are actually deployed, so it can claim nothing
     * about specific content. What it covers is that the app boots, fetches,
     * routes and renders an image at every level of the hierarchy.
     */
    test('navigate through album hierarchy', async ({ page }) => {
        await test.step('root album links to a year', async () => {
            await page.goto('/');

            // The title is set by the album fetch, so this is also the first
            // evidence that the app got a response at all
            await expect(page).toHaveTitle(/Moses|Family/i);

            await openNewestThumbnail(page);

            // A year, not something deeper: proof the root album's thumbnails
            // link where they should
            await expect(page).toHaveURL(YEAR_ALBUM_URL);
        });

        await test.step('year album links to a day', async () => {
            await openNewestThumbnail(page);
            await expect(page).toHaveURL(DAY_ALBUM_URL);
        });

        await test.step('day album links to a media item', async () => {
            await openNewestThumbnail(page);
            await expect(page).toHaveURL(MEDIA_URL);
        });

        await test.step('media page renders the image', async () => {
            // Scoped to the media region so the nav arrows can't match. Holds an
            // image whether the item is a photo or a video (a video renders its
            // poster frame there).
            const mainImage = page.getByRole('region', { name: 'Media' }).getByRole('img');
            await expect(mainImage).toBeVisible();
            await expectImageLoaded(mainImage);
        });

        await test.step('next arrow moves to the following media item', async () => {
            const firstImageUrl = page.url();

            // The media page always renders a Next button, and it has an href
            // here because we navigated into the newest media of the album. Its
            // accessible name comes from the anchor's title attribute, since the
            // label span is empty when no title is passed.
            await page.getByRole('link', { name: 'Next', exact: true }).click();

            // Routing between two media items in the same album is client-side,
            // so the URL changing is what says the navigation happened
            await page.waitForURL((url) => url.toString() !== firstImageUrl);
            await expect(page).toHaveURL(MEDIA_URL);

            const nextImage = page.getByRole('region', { name: 'Media' }).getByRole('img');
            await expect(nextImage).toBeVisible();
            await expectImageLoaded(nextImage);
        });
    });
});
