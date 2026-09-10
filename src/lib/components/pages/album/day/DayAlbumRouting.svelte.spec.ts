import { describe, it, expect, beforeEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import DayAlbumRouting from './DayAlbumRouting.svelte';
import { albumState } from '$lib/stores/AlbumState.svelte';
import { AlbumLoadStatus, CreateStatus, DeleteStatus, RenameStatus } from '$lib/models/album';
import { resetAlbumState } from '$lib/test-support/albumState';
import { renameEntry } from '$lib/test-support/records';

/**
 * What a reader of a day album sees for each state the album can be in.
 *
 * The page title is what these assert on, because it is the whole of what
 * separates the pages that carry no words -- a spinner is all the loading page
 * has -- and because the pages that do repeat their title in the body, which
 * makes matching on the message alone hit the heading as well.
 */
const PATH = '/2001/12-31/';
const ALBUM_CONTENT = 'the album itself';

const album = createRawSnippet(() => ({ render: () => `<p>${ALBUM_CONTENT}</p>` }));

function show() {
    return render(DayAlbumRouting, { albumPath: PATH, loaded: album });
}

const setStatus = (loadStatus: AlbumLoadStatus) => () => albumState.albums.set(PATH, { loadStatus });

/** States whose page says nothing its title does not already say */
const TITLE_ONLY: { state: string; seed: () => void; title: string }[] = [
    { state: 'NOT_LOADED', seed: setStatus(AlbumLoadStatus.NOT_LOADED), title: 'Loading...' },
    { state: 'LOADING', seed: setStatus(AlbumLoadStatus.LOADING), title: 'Loading...' },
    {
        state: 'being deleted',
        seed: () => albumState.albumDeletes.set(PATH, { status: DeleteStatus.IN_PROGRESS }),
        title: 'Delete in progress',
    },
    {
        state: 'being renamed',
        seed: () => albumState.albumRenames.set(PATH, renameEntry(PATH, '12-30/', RenameStatus.IN_PROGRESS)),
        title: 'Rename in progress',
    },
];

/** States whose page carries a message of its own */
const WITH_MESSAGE: { state: string; seed: () => void; title: string; message: string }[] = [
    {
        state: 'ERROR_LOADING',
        seed: setStatus(AlbumLoadStatus.ERROR_LOADING),
        title: 'Error',
        message: 'Error retrieving album',
    },
    {
        state: 'DOES_NOT_EXIST',
        seed: setStatus(AlbumLoadStatus.DOES_NOT_EXIST),
        title: 'Album Not Found',
        message: 'Album does not exist.',
    },
    {
        state: 'being created',
        seed: () => albumState.albumCreates.set(PATH, { status: CreateStatus.IN_PROGRESS }),
        title: 'Error',
        message: 'Creating...',
    },
];

describe(DayAlbumRouting, () => {
    beforeEach(() => {
        resetAlbumState();
        // A title left behind by the last render would let a component that
        // sets none pass on the previous test's value
        document.title = 'unset';
    });

    /**
     * The load machine records a status for every album it touches, so an album
     * it has recorded nothing about is one whose load failed before it could.
     * The reader waits on a spinner that nothing will take down.
     */
    it('waits on an album absent from memory', async () => {
        const screen = await show();

        expect(document.title).toBe('Loading...');
        await expect.element(screen.getByText(ALBUM_CONTENT)).not.toBeInTheDocument();
    });

    it.each(TITLE_ONLY)('an album $state shows $title', async ({ seed, title }) => {
        seed();

        const screen = await show();

        expect(document.title).toBe(title);
        await expect.element(screen.getByText(ALBUM_CONTENT)).not.toBeInTheDocument();
    });

    it.each(WITH_MESSAGE)('an album $state shows $message', async ({ seed, title, message }) => {
        seed();

        const screen = await show();

        expect(document.title).toBe(title);
        await expect.element(screen.getByText(message)).toBeVisible();
        await expect.element(screen.getByText(ALBUM_CONTENT)).not.toBeInTheDocument();
    });

    it('shows the album once it is loaded', async () => {
        albumState.albums.set(PATH, { loadStatus: AlbumLoadStatus.LOADED });

        const screen = await show();

        await expect.element(screen.getByText(ALBUM_CONTENT)).toBeVisible();
    });
});
