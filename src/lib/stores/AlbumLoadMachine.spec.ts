import { describe, it, expect, beforeEach, vi } from 'vitest';
import { albumLoadMachine } from './AlbumLoadMachine.svelte';
import { albumState } from './AlbumState.svelte';
import { AlbumLoadStatus, ReloadStatus } from '$lib/models/album';
import { clear as clearDisk, get as getFromDisk, keys as diskKeys, set as setOnDisk } from 'idb-keyval';
import { fakeServer, jsonResponse, notFound, serverError } from '$lib/test-support/http';
import { resetAlbumState, seedLoadedAlbum } from '$lib/test-support/albumState';
import { albumRecord, imageRecord, mediaPath } from '$lib/test-support/records';

/**
 * Covers the album load pipeline end to end: memory, the browser's disk cache
 * and the server. The disk is the real idb-keyval over fake-indexeddb, so the
 * library runs rather than being stubbed out; the API is answered by a fake
 * server. Nothing here reaches the network.
 *
 * albumLoadMachine is a module singleton writing to the AlbumState singleton,
 * so a spec resets that state rather than constructing a machine.
 */
const PATH = '/2001/12-31/';
const PARENT_PATH = '/2001/';
const ROUTE = '/album/2001/12-31/';
const IMAGE_PATH = mediaPath('image.jpg');

function record() {
    return albumRecord({
        path: PATH,
        parentPath: PARENT_PATH,
        itemName: '12-31',
        children: [imageRecord({ itemType: 'image', path: IMAGE_PATH, itemName: 'image.jpg' })],
    });
}

const loadStatus = (path = PATH): AlbumLoadStatus | undefined => albumState.albums.get(path)?.loadStatus;

/**
 * Lets fire-and-forget work run before asserting that it did nothing.
 *
 * Only sound for asserting an absence, where arriving too early can only pass
 * when it should pass. Waiting a fixed span for something to *appear* is a
 * flake: the disk is a real IndexedDB, and an open plus a transaction takes
 * more event-loop turns than this, on a machine under load more still. Wait on
 * the end state the work reaches instead.
 */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('albumLoadMachine', () => {
    beforeEach(async () => {
        await clearDisk();
        resetAlbumState();
    });

    describe('fetch', () => {
        it.each(['/2001/12-31', '/2001', 'nonsense', '/2001/13-01/'])('refuses to fetch %s', (path) => {
            expect(() => albumLoadMachine.fetch(path)).toThrow(`Invalid album path [${path}]`);
        });

        it('falls through to the server when the album is not on disk, and caches what came back', async () => {
            const server = fakeServer();
            server.get(ROUTE, jsonResponse(record()));

            albumLoadMachine.fetch(PATH);

            await vi.waitFor(() => expect(loadStatus()).toBe(AlbumLoadStatus.LOADED));

            expect(albumState.albums.get(PATH)?.album?.media.map((m) => m.path)).toStrictEqual([IMAGE_PATH]);
            expect(server.calls).toStrictEqual([{ method: 'GET', pathname: ROUTE, body: undefined }]);
            await expect(getFromDisk(PATH)).resolves.toStrictEqual(record());
            // Cached under the album path itself, which is what lets a later
            // session find it without consulting an index
            await expect(diskKeys()).resolves.toStrictEqual([PATH]);
        });

        it('marks the album LOADING before any of that has happened', () => {
            const server = fakeServer();
            server.get(ROUTE, jsonResponse(record()));

            albumLoadMachine.fetch(PATH);

            expect(loadStatus()).toBe(AlbumLoadStatus.LOADING);
        });

        // The disk copy is what the reader sees while the server request is in
        // flight, and all they will see if it never arrives
        it('shows the disk copy when the server cannot be reached', async () => {
            await setOnDisk(PATH, record());
            const server = fakeServer();
            server.get(ROUTE, () => {
                throw new Error('offline');
            });

            albumLoadMachine.fetch(PATH);

            await vi.waitFor(() => expect(loadStatus()).toBe(AlbumLoadStatus.LOADED));

            expect(albumState.albums.get(PATH)?.album?.media.map((m) => m.path)).toStrictEqual([IMAGE_PATH]);
            expect(server.calls).toHaveLength(1);
        });

        it('asks the server for a fresher copy even when the album was on disk', async () => {
            await setOnDisk(PATH, record());
            const server = fakeServer();
            server.get(ROUTE, jsonResponse(record()));

            albumLoadMachine.fetch(PATH);

            await vi.waitFor(() => expect(loadStatus()).toBe(AlbumLoadStatus.LOADED));
            await vi.waitFor(() => expect(server.calls).toHaveLength(1));
        });

        it('leaves an album that is already being loaded alone', async () => {
            const server = fakeServer();
            server.get(ROUTE, jsonResponse(record()));
            albumLoadMachine.fetch(PATH);

            albumLoadMachine.fetch(PATH);

            // Waiting for the load to finish is what makes the count final: by
            // the time the album is LOADED, a second request would have been
            // sent already if the machine were going to send one
            await vi.waitFor(() => expect(loadStatus()).toBe(AlbumLoadStatus.LOADED));

            expect(server.calls).toHaveLength(1);
        });

        it('serves an album already in memory without asking the server', async () => {
            seedLoadedAlbum(record());
            const server = fakeServer();

            albumLoadMachine.fetch(PATH, false);

            await settle();

            expect(server.calls).toStrictEqual([]);
            expect(loadStatus()).toBe(AlbumLoadStatus.LOADED);
        });

        it('re-asks the server for an album already in memory when told to', async () => {
            seedLoadedAlbum(record());
            const server = fakeServer();
            server.get(ROUTE, jsonResponse(record()));

            albumLoadMachine.fetch(PATH);

            // The album stays readable throughout: a reload is reported
            // separately from the load that already succeeded
            expect(loadStatus()).toBe(AlbumLoadStatus.LOADED);
            expect(albumState.albumUpdates.get(PATH)).toBe(ReloadStatus.RELOADING);

            await vi.waitFor(() => expect(albumState.albumUpdates.get(PATH)).toBe(ReloadStatus.NOT_RELOADING));

            expect(server.calls).toHaveLength(1);
        });
    });

    describe('fetchFromServer', () => {
        it('records an album the server does not have, and drops the stale disk copy', async () => {
            await setOnDisk(PATH, record());
            const server = fakeServer();
            server.get(ROUTE, notFound());

            await albumLoadMachine.fetchFromServer(PATH);

            expect(loadStatus()).toBe(AlbumLoadStatus.DOES_NOT_EXIST);

            await vi.waitFor(async () => {
                await expect(getFromDisk(PATH)).resolves.toBeUndefined();
            });
        });

        it.each([
            { failure: 'a server error', reply: serverError() },
            {
                failure: 'the network being down',
                reply: () => {
                    throw new Error('offline');
                },
            },
        ])('reports $failure on an album that never loaded', async ({ reply }) => {
            const server = fakeServer();
            server.get(ROUTE, reply);

            await albumLoadMachine.fetchFromServer(PATH);

            expect(loadStatus()).toBe(AlbumLoadStatus.ERROR_LOADING);
        });

        /**
         * The failure handler used to read the album's status straight out of
         * memory and raise when it found nothing. Every admin machine calls
         * this for an album that is not in memory yet -- a newly created album,
         * or the parent of a deleted one -- so a failed fetch reported a missing
         * album instead of the failure, and on the one call site that does not
         * await it, went unhandled.
         */
        it('reports the failure, not a missing album, when the album was never in memory', async () => {
            const server = fakeServer();
            server.get(ROUTE, serverError());

            await expect(albumLoadMachine.fetchFromServer(PATH)).resolves.toBeUndefined();
            expect(loadStatus()).toBe(AlbumLoadStatus.ERROR_LOADING);
        });

        it('keeps an album that is already loaded readable when a reload fails', async () => {
            seedLoadedAlbum(record());
            const server = fakeServer();
            server.get(ROUTE, serverError());

            await albumLoadMachine.fetchFromServer(PATH);

            expect(loadStatus()).toBe(AlbumLoadStatus.LOADED);
            expect(albumState.albumUpdates.get(PATH)).toBe(ReloadStatus.ERROR_RELOADING);
        });
    });

    describe('updateAlbumEntry', () => {
        it('writes the album through to disk as well as memory', async () => {
            const entry = seedLoadedAlbum(record());
            entry.album.summary = 'Edited';

            albumLoadMachine.updateAlbumEntry(entry);

            expect(albumState.albums.get(PATH)?.album?.summary).toBe('Edited');

            await vi.waitFor(async () => {
                await expect(getFromDisk(PATH)).resolves.toMatchObject({ summary: 'Edited' });
            });
        });

        it('refuses an album it has never seen', () => {
            const entry = { loadStatus: AlbumLoadStatus.LOADED, album: seedLoadedAlbum(record()).album };
            albumState.albums.clear();

            expect(() => albumLoadMachine.updateAlbumEntry(entry)).toThrow('albumEntryStore is null');
        });
    });

    describe('removeFromMemoryAndDisk', () => {
        it('removes the album from both', async () => {
            await setOnDisk(PATH, record());
            seedLoadedAlbum(record());

            await albumLoadMachine.removeFromMemoryAndDisk(PATH);

            expect(albumState.albums.has(PATH)).toBe(false);
            await expect(getFromDisk(PATH)).resolves.toBeUndefined();
        });

        it.each(['/2001/12-31', 'nonsense'])('refuses to remove %s', async (path) => {
            await expect(albumLoadMachine.removeFromMemoryAndDisk(path)).rejects.toThrow(
                `Invalid album path [${path}]`,
            );
        });
    });

    describe('albumExists', () => {
        it.each([
            { where: 'memory', seed: async () => void seedLoadedAlbum(record()), expected: true },
            { where: 'disk', seed: () => setOnDisk(PATH, record()), expected: true },
        ])('finds an album in $where without asking the server', async ({ seed, expected }) => {
            await seed();
            const server = fakeServer();

            await expect(albumLoadMachine.albumExists(PATH)).resolves.toBe(expected);
            expect(server.calls).toStrictEqual([]);
        });

        it.each([
            { reply: jsonResponse(record()), expected: true },
            { reply: notFound(), expected: false },
        ])('asks the server, which answers $expected', async ({ reply, expected }) => {
            const server = fakeServer();
            server.head(ROUTE, reply);

            await expect(albumLoadMachine.albumExists(PATH)).resolves.toBe(expected);
            expect(server.calls).toStrictEqual([{ method: 'HEAD', pathname: ROUTE, body: undefined }]);
        });
    });
});
