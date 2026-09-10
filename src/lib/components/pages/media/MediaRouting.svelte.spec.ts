import { describe, it, expect, beforeEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import MediaRouting from './MediaRouting.svelte';
import { albumState } from '$lib/stores/AlbumState.svelte';
import { AlbumLoadStatus, DeleteStatus, RenameStatus, UploadState } from '$lib/models/album';
import type { Media } from '$lib/models/GalleryItemInterfaces';
import { resetAlbumState } from '$lib/test-support/albumState';
import { dayAlbum, imageRecord, mediaPath, renameEntry, uploadEntry } from '$lib/test-support/records';

/**
 * What a reader of a media item sees for each state its album can be in. The
 * media page keys off the album's load status, because the item is only
 * reachable through the album that holds it.
 *
 * The loading page carries no words at all, so the document title is the only
 * thing separating it from the others and every row asserts it. The processing
 * pages put their title on the screen as a heading as well, and the error
 * pages, which sit in the album layout and so have no heading, carry a message
 * of their own instead.
 *
 * A load status is keyed by album path and a processing state by item path, so
 * each row seeds a target it is given: the same row says what this item's page
 * shows in that state, and that a neighbour in that state leaves this page alone.
 */
const ALBUM_PATH = '/2001/12-31/';
const MEDIA_PATH = mediaPath('image.jpg');
const MEDIA_CONTENT = 'the media itself';
/** The media loading page sets an empty title rather than announcing itself */
const NO_TITLE = '';

/** Where a seed lands: a load status on the album, a processing state on the item */
type Target = { albumPath: string; mediaPath: string };
const THIS: Target = { albumPath: ALBUM_PATH, mediaPath: MEDIA_PATH };
/** A second album, and a second item in this one, to say which one a page is reading */
const OTHER: Target = { albumPath: '/2001/12-30/', mediaPath: mediaPath('other.jpg') };

const media = dayAlbum([imageRecord({ itemType: 'image', path: MEDIA_PATH, itemName: 'image.jpg' })]).media[0];
const item = createRawSnippet(() => ({ render: () => `<p>${MEDIA_CONTENT}</p>` }));

function show(overrides: { media?: Media | undefined } = {}) {
    return render(MediaRouting, { albumPath: ALBUM_PATH, mediaPath: MEDIA_PATH, media, loaded: item, ...overrides });
}

type Seed = (target: Target) => void;
type Case = { state: string; seed: Seed; title: string };
type MessageCase = Case & { message: string };

const setStatus =
    (loadStatus: AlbumLoadStatus): Seed =>
    ({ albumPath }) =>
        albumState.albums.set(albumPath, { loadStatus });
const setUpload =
    (status: UploadState): Seed =>
    ({ mediaPath }) =>
        albumState.uploads.push(uploadEntry({ mediaPath, status }));

/** States whose page puts no words on the screen, leaving the title to carry it */
const WORDLESS: Case[] = [
    { state: 'NOT_LOADED', seed: setStatus(AlbumLoadStatus.NOT_LOADED), title: NO_TITLE },
    { state: 'LOADING', seed: setStatus(AlbumLoadStatus.LOADING), title: NO_TITLE },
];

/** States whose page announces itself with a heading as well as a title */
const PROCESSING: Case[] = [
    {
        state: 'holding an upload not started',
        seed: setUpload(UploadState.UPLOAD_NOT_STARTED),
        title: 'Upload Not Started',
    },
    { state: 'holding an upload in flight', seed: setUpload(UploadState.UPLOADING), title: 'Upload In Progress' },
    { state: 'holding an upload being processed', seed: setUpload(UploadState.PROCESSING), title: 'Upload Processing' },
    {
        state: 'renaming an item',
        seed: ({ mediaPath }) =>
            albumState.mediaRenames.set(mediaPath, renameEntry(mediaPath, 'renamed.jpg', RenameStatus.IN_PROGRESS)),
        title: 'Rename In Progress',
    },
    {
        state: 'deleting an item',
        seed: ({ mediaPath }) => albumState.mediaDeletes.set(mediaPath, { status: DeleteStatus.IN_PROGRESS }),
        title: 'Delete In Progress',
    },
];

/** States whose page carries a message instead of a heading */
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
        message: 'Album not found',
    },
];

describe(MediaRouting, () => {
    beforeEach(() => {
        resetAlbumState();
        // A title left behind by the last render would let a component that
        // sets none pass on the previous test's value
        document.title = 'unset';
    });

    /**
     * An album can leave memory while a page inside it is still mounted: the
     * rename machine drops the old album deliberately, without waiting, so the
     * reader moves on. Until they do, the item waits the way the album pages
     * do rather than falling through to the catch-all, which renders outside
     * any layout and so offers no title and no way back.
     */
    it('waits on an album absent from memory', async () => {
        const screen = await show();

        expect(document.title).toBe(NO_TITLE);
        await expect.element(screen.getByText(MEDIA_CONTENT)).not.toBeInTheDocument();
    });

    it.each(WORDLESS)('an album $state shows $title', async ({ seed, title }) => {
        seed(THIS);

        const screen = await show();

        expect(document.title).toBe(title);
        await expect.element(screen.getByText(MEDIA_CONTENT)).not.toBeInTheDocument();
    });

    it.each(PROCESSING)('an album $state shows $title', async ({ seed, title }) => {
        seed(THIS);

        const screen = await show();

        expect(document.title).toBe(title);
        await expect.element(screen.getByRole('heading', { name: title })).toBeVisible();
        await expect.element(screen.getByText(MEDIA_CONTENT)).not.toBeInTheDocument();
    });

    it.each(WITH_MESSAGE)('an album $state shows $message', async ({ seed, title, message }) => {
        seed(THIS);

        const screen = await show();

        expect(document.title).toBe(title);
        await expect.element(screen.getByText(message)).toBeVisible();
        await expect.element(screen.getByText(MEDIA_CONTENT)).not.toBeInTheDocument();
    });

    // The icon carries the link's only word: unlabelled, it reads "Go back ?"
    it('an album ERROR_LOADING offers a labelled way home', async () => {
        albumState.albums.set(ALBUM_PATH, { loadStatus: AlbumLoadStatus.ERROR_LOADING });

        const screen = await show();

        await expect.element(screen.getByRole('link', { name: 'Go back Home?' })).toBeVisible();
    });

    it('shows the media once the album is loaded', async () => {
        albumState.albums.set(ALBUM_PATH, { loadStatus: AlbumLoadStatus.LOADED });

        const screen = await show();

        await expect.element(screen.getByText(MEDIA_CONTENT)).toBeVisible();
    });

    // The upload rows are the ones with teeth: uploads are a list rather than a
    // map, so which entry this page reads is a search rather than a lookup
    it.each([...WORDLESS, ...PROCESSING, ...WITH_MESSAGE])(
        'a neighbour $state leaves this page alone',
        async ({ seed }) => {
            albumState.albums.set(ALBUM_PATH, { loadStatus: AlbumLoadStatus.LOADED });
            seed(OTHER);

            const screen = await show();

            await expect.element(screen.getByText(MEDIA_CONTENT)).toBeVisible();
        },
    );

    // What a stale link to a deleted or renamed item lands on
    it('reports a missing item on an album that loaded without it', async () => {
        albumState.albums.set(ALBUM_PATH, { loadStatus: AlbumLoadStatus.LOADED });

        await show({ media: undefined });

        expect(document.title).toBe('Media Not Found');
    });

    /**
     * The album stays loaded while an item inside it is being deleted, so both
     * states are true at once and the order of the branches is the whole of
     * what decides which one the reader gets.
     */
    it('an item being deleted stays on the delete page on a loaded album', async () => {
        albumState.albums.set(ALBUM_PATH, { loadStatus: AlbumLoadStatus.LOADED });
        albumState.mediaDeletes.set(MEDIA_PATH, { status: DeleteStatus.IN_PROGRESS });

        const screen = await show();

        expect(document.title).toBe('Delete In Progress');
        await expect.element(screen.getByText(MEDIA_CONTENT)).not.toBeInTheDocument();
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
        albumState.albums.set(ALBUM_PATH, { loadStatus: 'WAT' as AlbumLoadStatus });

        const screen = await show();

        expect(document.title).toBe('Error');
        await expect.element(screen.getByText('Unknown status: [WAT]')).toBeVisible();
    });
});
