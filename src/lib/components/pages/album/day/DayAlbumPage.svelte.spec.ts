import { describe, it, expect, beforeEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import DayAlbumPage from './DayAlbumPage.svelte';
import { resetAlbumState, seedLoadedAlbum } from '$lib/test-support/albumState';
import { albumRecord, dayAlbum } from '$lib/test-support/records';
import { shortDate } from '$lib/utils/date-utils';

/**
 * The prev and next buttons come from the parent album's child list, read off
 * the store. On a cold visit the album and its parent load in parallel and
 * either can land first, so the page has to follow the parent arriving after
 * it has rendered.
 */
const ALBUM = dayAlbum([]); // the newest of its year
const PARENT = albumRecord({
    children: [
        albumRecord({ path: '/2001/12-30/', parentPath: '/2001/', itemName: '12-30' }),
        albumRecord({ path: ALBUM.path, parentPath: '/2001/', itemName: '12-31' }),
    ],
});
// The browser's locale decides the text; which album it names is the assertion
const OLDER = shortDate(new Date(2001, 11, 30));

describe(DayAlbumPage, () => {
    beforeEach(() => resetAlbumState());

    it('links next to the older sibling, and has nothing newer to link prev to', async () => {
        seedLoadedAlbum(PARENT);

        const screen = await render(DayAlbumPage, { album: ALBUM });

        await expect
            .element(screen.getByRole('link', { name: OLDER, exact: true }))
            .toHaveAttribute('href', '/2001/12-30');
        await expect
            .element(screen.getByRole('link', { name: 'Previous', exact: true }))
            .toHaveAttribute('aria-disabled', 'true');
    });

    it('disables the buttons until the parent arrives, then links them', async () => {
        const screen = await render(DayAlbumPage, { album: ALBUM });

        await expect
            .element(screen.getByRole('link', { name: 'Next', exact: true }))
            .toHaveAttribute('aria-disabled', 'true');

        seedLoadedAlbum(PARENT);

        await expect
            .element(screen.getByRole('link', { name: OLDER, exact: true }))
            .toHaveAttribute('href', '/2001/12-30');
    });
});
