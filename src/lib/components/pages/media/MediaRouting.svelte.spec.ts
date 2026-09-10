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
 * The page title is what these assert on: the processing pages repeat their
 * title in the body, so matching on the message alone hits the heading too.
 */
const ALBUM_PATH = '/2001/12-31/';
const MEDIA_PATH = mediaPath('image.jpg');
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

const TITLE_ONLY: { state: string; seed: () => void; title: string }[] = [
    { state: 'NOT_LOADED', seed: setStatus(AlbumLoadStatus.NOT_LOADED), title: NO_TITLE },
    { state: 'LOADING', seed: setStatus(AlbumLoadStatus.LOADING), title: NO_TITLE },
    { state: 'DOES_NOT_EXIST', seed: setStatus(AlbumLoadStatus.DOES_NOT_EXIST), title: 'Album Not Found' },
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

describe(MediaRouting, () => {
    beforeEach(() => {
        resetAlbumState();
        // A title left behind by the last render would let a component that
        // sets none pass on the previous test's value
        document.title = 'unset';
    });

    it.each(TITLE_ONLY)('an album $state shows $title', async ({ seed, title }) => {
        seed();

        const screen = await show();

        expect(document.title).toBe(title);
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
});
