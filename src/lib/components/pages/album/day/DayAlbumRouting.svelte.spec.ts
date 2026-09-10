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
 * Some of these pages carry no words at all -- the loading page is a spinner
 * and nothing else -- so the title, which reaches the reader only through
 * <svelte:head>, is the one thing that tells them apart. Every row asserts it,
 * and the pages that do carry words assert those too.
 *
 * Every state is keyed by album path, so each row seeds a path it is given:
 * the same row says what this album's page shows in that state, and that a
 * neighbouring album in that state leaves this page alone.
 */
const PATH = '/2001/12-31/';
/** A second day album, to say which one a page is reading */
const OTHER_PATH = '/2001/12-30/';
const ALBUM_CONTENT = 'the album itself';
/** Stands in for a title no component set, so the previous test's cannot pass for one */
const UNSET_TITLE = 'unset';

const album = createRawSnippet(() => ({ render: () => `<p>${ALBUM_CONTENT}</p>` }));

function show() {
    return render(DayAlbumRouting, { albumPath: PATH, loaded: album });
}

type Seed = (path: string) => void;
type Case = { state: string; seed: Seed; title: string };
type MessageCase = Case & { message: string };

const setStatus =
    (loadStatus: AlbumLoadStatus): Seed =>
    (path) =>
        albumState.albums.set(path, { loadStatus });

/** States whose page puts no words on the screen, leaving the title to carry it */
const WORDLESS: Case[] = [
    { state: 'NOT_LOADED', seed: setStatus(AlbumLoadStatus.NOT_LOADED), title: 'Loading...' },
    { state: 'LOADING', seed: setStatus(AlbumLoadStatus.LOADING), title: 'Loading...' },
];

/** States whose page also says something on the screen */
const WITH_MESSAGE: MessageCase[] = [
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
    // The processing pages repeat their title on the page, so message and title
    // are the same words reaching the reader by two different routes
    {
        state: 'being created',
        seed: (path) => albumState.albumCreates.set(path, { status: CreateStatus.IN_PROGRESS }),
        title: 'Create in progress',
        message: 'Create in progress',
    },
    {
        state: 'being deleted',
        seed: (path) => albumState.albumDeletes.set(path, { status: DeleteStatus.IN_PROGRESS }),
        title: 'Delete in progress',
        message: 'Delete in progress',
    },
    {
        state: 'being renamed',
        seed: (path) => albumState.albumRenames.set(path, renameEntry(path, '12-30/', RenameStatus.IN_PROGRESS)),
        title: 'Rename in progress',
        message: 'Rename in progress',
    },
];

describe(DayAlbumRouting, () => {
    beforeEach(() => {
        resetAlbumState();
        // A title left behind by the last render would let a component that
        // sets none pass on the previous test's value
        document.title = UNSET_TITLE;
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

    it.each(WORDLESS)('an album $state shows $title', async ({ seed, title }) => {
        seed(PATH);

        const screen = await show();

        expect(document.title).toBe(title);
        await expect.element(screen.getByText(ALBUM_CONTENT)).not.toBeInTheDocument();
    });

    it.each(WITH_MESSAGE)('an album $state shows $message', async ({ seed, title, message }) => {
        seed(PATH);

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

    /**
     * The page mounts before its album arrives on every navigation, so the
     * store changing under a mounted page is the ordinary case rather than an
     * edge. Every other test seeds before it renders and so cannot tell a
     * reactive read from a snapshot.
     */
    it('follows the album from loading to loaded under the page', async () => {
        albumState.albums.set(PATH, { loadStatus: AlbumLoadStatus.LOADING });
        const screen = await show();

        await expect.element(screen.getByText(ALBUM_CONTENT)).not.toBeInTheDocument();

        albumState.albums.set(PATH, { loadStatus: AlbumLoadStatus.LOADED });

        await expect.element(screen.getByText(ALBUM_CONTENT)).toBeVisible();
    });

    // The neighbour goes into the store first, so a lookup that lands on the
    // first entry rather than on this album's cannot pass by accident
    it.each([...WORDLESS, ...WITH_MESSAGE])('another album $state leaves this page alone', async ({ seed }) => {
        seed(OTHER_PATH);
        albumState.albums.set(PATH, { loadStatus: AlbumLoadStatus.LOADED });

        const screen = await show();

        await expect.element(screen.getByText(ALBUM_CONTENT)).toBeVisible();
    });

    /**
     * An album keeps its loaded copy while it is being deleted, so both states
     * are true at once and the order of the branches is the whole of what
     * decides which one the reader gets.
     */
    it('an album being deleted stays on the delete page after it has loaded', async () => {
        albumState.albums.set(PATH, { loadStatus: AlbumLoadStatus.LOADED });
        albumState.albumDeletes.set(PATH, { status: DeleteStatus.IN_PROGRESS });

        const screen = await show();

        expect(document.title).toBe('Delete in progress');
        await expect.element(screen.getByText(ALBUM_CONTENT)).not.toBeInTheDocument();
    });

    /**
     * The cast is the only way in: a status outside the enum is what a server
     * or a store change could hand this component, and TypeScript cannot.
     *
     * The status itself is on the page because it is the only clue to what went
     * wrong, but it reaches the reader inside a page that is titled and has the
     * site's navigation, the way every other state does.
     */
    it('an unrecognized status shows the status on a titled page', async () => {
        albumState.albums.set(PATH, { loadStatus: 'WAT' as AlbumLoadStatus });

        const screen = await show();

        expect(document.title).toBe('Error');
        await expect.element(screen.getByText('Unknown album status: WAT')).toBeVisible();
    });

    // The icon carries the link's only word: unlabelled, it reads "Go back ?"
    it('an album DOES_NOT_EXIST offers a labelled way home', async () => {
        albumState.albums.set(PATH, { loadStatus: AlbumLoadStatus.DOES_NOT_EXIST });

        const screen = await show();

        await expect.element(screen.getByRole('link', { name: 'Go back Home?' })).toBeVisible();
    });
});
