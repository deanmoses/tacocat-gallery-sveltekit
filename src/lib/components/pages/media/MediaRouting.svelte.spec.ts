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
 */
const ALBUM_PATH = '/2001/12-31/';
const MEDIA_PATH = mediaPath('image.jpg');
/** A second item in the same album, to say which one a page is reading */
const OTHER_MEDIA_PATH = mediaPath('other.jpg');
const MEDIA_CONTENT = 'the media itself';
/** The media loading page sets an empty title rather than announcing itself */
const NO_TITLE = '';

const media = dayAlbum([imageRecord({ itemType: 'image', path: MEDIA_PATH, itemName: 'image.jpg' })]).media[0];
const item = createRawSnippet(() => ({ render: () => `<p>${MEDIA_CONTENT}</p>` }));

function show(overrides: { media?: Media | undefined } = {}) {
    return render(MediaRouting, { albumPath: ALBUM_PATH, mediaPath: MEDIA_PATH, media, loaded: item, ...overrides });
}

const setStatus = (loadStatus: AlbumLoadStatus) => () => albumState.albums.set(ALBUM_PATH, { loadStatus });
const setUpload = (status: UploadState) => () =>
    albumState.uploads.push(uploadEntry({ mediaPath: MEDIA_PATH, status }));

/** States whose page puts no words on the screen, leaving the title to carry it */
const WORDLESS: { state: string; seed: () => void; title: string }[] = [
    { state: 'NOT_LOADED', seed: setStatus(AlbumLoadStatus.NOT_LOADED), title: NO_TITLE },
    { state: 'LOADING', seed: setStatus(AlbumLoadStatus.LOADING), title: NO_TITLE },
];

/** States whose page announces itself with a heading as well as a title */
const PROCESSING: { state: string; seed: () => void; title: string }[] = [
    {
        state: 'holding an upload not started',
        seed: setUpload(UploadState.UPLOAD_NOT_STARTED),
        title: 'Upload Not Started',
    },
    { state: 'holding an upload in flight', seed: setUpload(UploadState.UPLOADING), title: 'Upload In Progress' },
    { state: 'holding an upload being processed', seed: setUpload(UploadState.PROCESSING), title: 'Upload Processing' },
    {
        state: 'renaming the item',
        seed: () =>
            albumState.mediaRenames.set(MEDIA_PATH, renameEntry(MEDIA_PATH, 'renamed.jpg', RenameStatus.IN_PROGRESS)),
        title: 'Rename In Progress',
    },
    {
        state: 'deleting the item',
        seed: () => albumState.mediaDeletes.set(MEDIA_PATH, { status: DeleteStatus.IN_PROGRESS }),
        title: 'Delete In Progress',
    },
];

/** States whose page carries a message instead of a heading */
const WITH_MESSAGE: { state: string; seed: () => void; title: string; message: string }[] = [
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
        seed();

        const screen = await show();

        expect(document.title).toBe(title);
        await expect.element(screen.getByText(MEDIA_CONTENT)).not.toBeInTheDocument();
    });

    it.each(PROCESSING)('an album $state shows $title', async ({ seed, title }) => {
        seed();

        const screen = await show();

        expect(document.title).toBe(title);
        await expect.element(screen.getByRole('heading', { name: title })).toBeVisible();
        await expect.element(screen.getByText(MEDIA_CONTENT)).not.toBeInTheDocument();
    });

    it.each(WITH_MESSAGE)('an album $state shows $message', async ({ seed, title, message }) => {
        seed();

        const screen = await show();

        expect(document.title).toBe(title);
        await expect.element(screen.getByText(message)).toBeVisible();
        await expect.element(screen.getByText(MEDIA_CONTENT)).not.toBeInTheDocument();
    });

    it('an album ERROR_LOADING says so, and offers a way home', async () => {
        setStatus(AlbumLoadStatus.ERROR_LOADING)();

        const screen = await show();

        expect(document.title).toBe('Error');
        await expect.element(screen.getByText('Error retrieving album')).toBeVisible();
        await expect.element(screen.getByRole('link', { name: 'Go back Home?' })).toBeVisible();
    });

    it('shows the media once the album is loaded', async () => {
        albumState.albums.set(ALBUM_PATH, { loadStatus: AlbumLoadStatus.LOADED });

        const screen = await show();

        await expect.element(screen.getByText(MEDIA_CONTENT)).toBeVisible();
    });

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

    // Uploads are a list rather than a map, so which entry this page reads is
    // a search rather than a lookup
    it('another item being uploaded leaves this page alone', async () => {
        albumState.albums.set(ALBUM_PATH, { loadStatus: AlbumLoadStatus.LOADED });
        albumState.uploads.push(uploadEntry({ mediaPath: OTHER_MEDIA_PATH, status: UploadState.UPLOADING }));

        const screen = await show();

        await expect.element(screen.getByText(MEDIA_CONTENT)).toBeVisible();
    });

    it('another item being renamed leaves this page alone', async () => {
        albumState.albums.set(ALBUM_PATH, { loadStatus: AlbumLoadStatus.LOADED });
        albumState.mediaRenames.set(
            OTHER_MEDIA_PATH,
            renameEntry(OTHER_MEDIA_PATH, 'renamed.jpg', RenameStatus.IN_PROGRESS),
        );

        const screen = await show();

        await expect.element(screen.getByText(MEDIA_CONTENT)).toBeVisible();
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
