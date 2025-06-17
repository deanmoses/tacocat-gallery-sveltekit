/**
 * Test suite for AlbumLoadMachine
 * Tests the state machine that handles loading album data from both IndexedDB and the server.
 * Verifies correct state transitions and error handling for various scenarios.
 */
import { describe, it, expect, vi, beforeEach, beforeAll, type Mock } from 'vitest';
import { albumLoadMachine } from '../AlbumLoadMachine.svelte';
import { albumState } from '../AlbumState.svelte';
import { AlbumStatus, ReloadStatus } from '$lib/models/album';
import { get as getFromIdb, set as setToIdb, del as delFromIdb } from 'idb-keyval';
import { createMockAlbumRecordFromPath } from './albumTestUtils';
import toAlbum from '$lib/models/impl/AlbumCreator';
import type { AlbumRecord } from '$lib/models/impl/server';

// Mock idb-keyval
vi.mock('idb-keyval', () => ({
    get: vi.fn(),
    set: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(undefined),
}));

describe('AlbumLoadMachine', () => {
    const mockFetch = vi.fn();
    const TEST_TIMEOUT = 1000;

    beforeAll(() => {
        vi.stubGlobal('fetch', mockFetch);
    });

    beforeEach(() => {
        vi.clearAllMocks();
        albumState.albums.clear();
        albumState.albumReloads.clear();
    });

    /**
     * Helper function to verify that fetch was called with a URL containing the given path
     * @param path - The path that should be included in the fetch URL
     */
    function expectFetchCalledWithPath(path: string) {
        expect(mockFetch).toHaveBeenCalled();
        expect(mockFetch.mock.calls.some((call) => call[0].includes(path))).toBe(true);
    }

    /**
     * Helper function to verify an album's status
     * @param path - The album path to check
     * @param expectedStatus - The expected AlbumStatus
     */
    function expectAlbumStatus(path: string, expectedStatus: AlbumStatus) {
        expect(albumState.albums.get(path)?.status).toBe(expectedStatus);
    }

    /**
     * Helper function to mock successful IDB retrieval
     * @param album - The album record to return from IDB, or undefined if not found
     */
    function mockIdbSuccess(album: AlbumRecord | undefined) {
        vi.mocked(getFromIdb).mockResolvedValueOnce(album);
    }

    /**
     * Helper function to mock successful album fetch from server
     * @param album - The album record to return from the server
     */
    function mockAlbumFetchSuccess(album: AlbumRecord) {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(album),
        });
    }

    /**
     * Helper function to mock 404 Not Found response from server
     */
    function mockAlbumFetchNotFound() {
        mockFetch.mockResolvedValue({
            ok: false,
            status: 404,
            json: () => Promise.resolve({ error: 'Not found' }),
        });
    }

    /**
     * Helper function to mock server error response
     * @param delay - Optional delay in milliseconds before resolving
     */
    function mockAlbumFetchFail(delay = 0) {
        if (delay > 0) {
            return mockFetch.mockImplementation(
                () =>
                    new Promise((resolve) =>
                        setTimeout(
                            () =>
                                resolve({
                                    ok: false,
                                    status: 500,
                                    json: () => Promise.resolve({ error: 'Server error' }),
                                }),
                            delay,
                        ),
                    ),
            );
        }
        return mockFetch.mockResolvedValue({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ error: 'Server error' }),
        });
    }

    describe('fetch', () => {
        it('should go NOT_LOADED > LOADING > LOADED when album found in both IDB and server', async () => {
            const albumPath = '/2024/01-01/';
            const mockAlbum = createMockAlbumRecordFromPath(albumPath);
            mockIdbSuccess(mockAlbum);
            mockAlbumFetchSuccess(mockAlbum);

            albumLoadMachine.fetch(albumPath);

            // Verify initial loading state
            expectAlbumStatus(albumPath, AlbumStatus.LOADING);

            // Verify final loaded state
            await vi.waitFor(
                () => {
                    expectAlbumStatus(albumPath, AlbumStatus.LOADED);
                },
                { timeout: TEST_TIMEOUT },
            );

            // Verify album data
            const loadedAlbum = albumState.albums.get(albumPath)?.album;
            expect(loadedAlbum).toBeDefined();
            expect(loadedAlbum?.path).toBe(albumPath);
            expect(loadedAlbum?.title).toBe('January 1, 2024');

            // Verify API calls
            expect(getFromIdb).toHaveBeenCalledWith(albumPath);
            expectFetchCalledWithPath(albumPath);
        });

        it('should go NOT_LOADED > LOADING > LOADED when album not in IDB but found on server', async () => {
            const albumPath = '/2024/01-01/';
            const mockAlbum = createMockAlbumRecordFromPath(albumPath);
            mockIdbSuccess(undefined);
            mockAlbumFetchSuccess(mockAlbum);

            albumLoadMachine.fetch(albumPath);

            // Verify initial loading state
            expectAlbumStatus(albumPath, AlbumStatus.LOADING);

            // Verify final loaded state
            await vi.waitFor(
                () => {
                    expectAlbumStatus(albumPath, AlbumStatus.LOADED);
                },
                { timeout: TEST_TIMEOUT },
            );

            // Verify album data
            const loadedAlbum = albumState.albums.get(albumPath)?.album;
            expect(loadedAlbum).toBeDefined();
            expect(loadedAlbum?.path).toBe(albumPath);
            expect(loadedAlbum?.title).toBe('January 1, 2024');

            // Verify API calls and IDB updates
            expect(getFromIdb).toHaveBeenCalledWith(albumPath);
            expectFetchCalledWithPath(albumPath);
            expect(vi.mocked(setToIdb)).toHaveBeenCalledWith(albumPath, mockAlbum);
        });

        it('should go NOT_LOADED > LOADING > LOADED > DOES_NOT_EXIST when album found in IDB but not on server', async () => {
            const albumPath = '/2024/01-01/';
            const mockAlbum = createMockAlbumRecordFromPath(albumPath);
            mockIdbSuccess(mockAlbum);
            mockAlbumFetchNotFound();

            albumLoadMachine.fetch(albumPath);

            // Verify initial loading state
            expectAlbumStatus(albumPath, AlbumStatus.LOADING);

            // Verify final state
            await vi.waitFor(
                () => {
                    expectAlbumStatus(albumPath, AlbumStatus.DOES_NOT_EXIST);
                },
                { timeout: TEST_TIMEOUT },
            );

            // Verify API calls and IDB cleanup
            expect(getFromIdb).toHaveBeenCalledWith(albumPath);
            expectFetchCalledWithPath(albumPath);
            expect(vi.mocked(delFromIdb)).toHaveBeenCalledWith(albumPath);
        });

        it('should keep IDB data when server returns 500', async () => {
            const albumPath = '/2024/01-01/';
            const mockAlbum = createMockAlbumRecordFromPath(albumPath);
            mockIdbSuccess(mockAlbum);
            mockAlbumFetchFail(100);

            albumLoadMachine.fetch(albumPath);

            // Verify initial loading state
            expectAlbumStatus(albumPath, AlbumStatus.LOADING);

            // Wait for IDB fetch to complete
            await vi.waitFor(
                () => {
                    return (getFromIdb as Mock).mock.calls.length > 0;
                },
                { timeout: TEST_TIMEOUT },
            );

            // Verify we go to LOADED after IDB fetch
            expectAlbumStatus(albumPath, AlbumStatus.LOADED);
            expect(getFromIdb).toHaveBeenCalledWith(albumPath);

            // Wait for server fetch to complete
            await vi.waitFor(
                () => {
                    return mockFetch.mock.calls.length > 0;
                },
                { timeout: TEST_TIMEOUT },
            );

            // Verify we remain in LOADED after server error
            expectAlbumStatus(albumPath, AlbumStatus.LOADED);
            expectFetchCalledWithPath(albumPath);
            expect(vi.mocked(delFromIdb)).not.toHaveBeenCalledWith(albumPath);
        });

        it('should go NOT_LOADED > LOADING > LOAD_ERRORED when album not in IDB and server returns 500', async () => {
            const albumPath = '/2024/01-01/';
            mockIdbSuccess(undefined);
            mockAlbumFetchFail();

            albumLoadMachine.fetch(albumPath);

            // Verify initial loading state
            expectAlbumStatus(albumPath, AlbumStatus.LOADING);

            // Verify final state
            await vi.waitFor(
                () => {
                    expectAlbumStatus(albumPath, AlbumStatus.LOAD_ERRORED);
                },
                { timeout: TEST_TIMEOUT },
            );

            // Verify API calls and no IDB updates
            expect(getFromIdb).toHaveBeenCalledWith(albumPath);
            expectFetchCalledWithPath(albumPath);
            expect(vi.mocked(setToIdb)).not.toHaveBeenCalled();
            expect(vi.mocked(delFromIdb)).not.toHaveBeenCalled();
        });

        it('should throw error for invalid album path', () => {
            const invalidPath = 'invalid-path';

            expect(() => {
                albumLoadMachine.fetch(invalidPath);
            }).toThrow(`Invalid album path [${invalidPath}]`);
        });

        it('should do nothing if album is already loading', () => {
            const albumPath = '/2024/01-01/';

            // Set album to loading state
            albumState.albums.set(albumPath, { status: AlbumStatus.LOADING });

            albumLoadMachine.fetch(albumPath);

            // It should remain in the LOADING state
            expectAlbumStatus(albumPath, AlbumStatus.LOADING);

            // Verify no additional API calls were made
            expect(getFromIdb).not.toHaveBeenCalled();
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('should do nothing if album is already reloading', () => {
            const albumPath = '/2024/01-01/';

            // Set album to reloading state
            albumState.albumReloads.set(albumPath, ReloadStatus.RELOADING);

            albumLoadMachine.fetch(albumPath);

            // Verify no additional API calls were made
            expect(getFromIdb).not.toHaveBeenCalled();
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('should refetch from server when album is already loaded and refetch=true', async () => {
            const albumPath = '/2024/01-01/';
            const mockAlbum = createMockAlbumRecordFromPath(albumPath);

            // Set album to loaded state
            albumState.albums.set(albumPath, {
                status: AlbumStatus.LOADED,
                album: toAlbum(mockAlbum),
            });

            mockAlbumFetchSuccess(mockAlbum);

            albumLoadMachine.fetch(albumPath, true); // refetch = true

            // Verify reloading state is set
            expect(albumState.albumReloads.get(albumPath)).toBe(ReloadStatus.RELOADING);

            // Verify server fetch was called
            await vi.waitFor(
                () => {
                    expectFetchCalledWithPath(albumPath);
                },
                { timeout: TEST_TIMEOUT },
            );
        });

        it('should not refetch when album is loaded and refetch=false', () => {
            const albumPath = '/2024/01-01/';
            const mockAlbum = createMockAlbumRecordFromPath(albumPath);

            // Set album to loaded state
            albumState.albums.set(albumPath, {
                status: AlbumStatus.LOADED,
                album: toAlbum(mockAlbum),
            });

            albumLoadMachine.fetch(albumPath, false); // refetch = false

            // Verify no reloading state is set
            expect(albumState.albumReloads.get(albumPath)).toBeUndefined();

            // Verify no server fetch was called
            expect(mockFetch).not.toHaveBeenCalled();
        });
    });

    describe('albumExists', () => {
        it('should return true when album exists in memory with LOADED status', async () => {
            const albumPath = '/2024/01-01/';
            const mockAlbum = createMockAlbumRecordFromPath(albumPath);

            albumState.albums.set(albumPath, {
                status: AlbumStatus.LOADED,
                album: toAlbum(mockAlbum),
            });

            const exists = await albumLoadMachine.albumExists(albumPath);
            expect(exists).toBe(true);
        });

        it('should return true when album exists in memory with LOADING status', async () => {
            const albumPath = '/2024/01-01/';

            albumState.albums.set(albumPath, {
                status: AlbumStatus.LOADING,
            });

            const exists = await albumLoadMachine.albumExists(albumPath);
            expect(exists).toBe(true);
        });

        it('should return false when album exists in memory with DOES_NOT_EXIST status', async () => {
            const albumPath = '/2024/01-01/';

            albumState.albums.set(albumPath, {
                status: AlbumStatus.DOES_NOT_EXIST,
            });

            const exists = await albumLoadMachine.albumExists(albumPath);
            expect(exists).toBe(false);
        });

        it('should return true when album exists on disk but not in memory', async () => {
            const albumPath = '/2024/01-01/';
            const mockAlbum = createMockAlbumRecordFromPath(albumPath);

            mockIdbSuccess(mockAlbum);

            const exists = await albumLoadMachine.albumExists(albumPath);
            expect(exists).toBe(true);
            expect(getFromIdb).toHaveBeenCalledWith(albumPath);
        });

        it('should return false when album not found on disk or server', async () => {
            const albumPath = '/2024/01-01/';

            mockIdbSuccess(undefined);
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
            });

            const exists = await albumLoadMachine.albumExists(albumPath);
            expect(exists).toBe(false);
            expect(getFromIdb).toHaveBeenCalledWith(albumPath);
            expectFetchCalledWithPath(albumPath);
        });

        it('should return true when album exists on server', async () => {
            const albumPath = '/2024/01-01/';

            mockIdbSuccess(undefined);
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
            });

            const exists = await albumLoadMachine.albumExists(albumPath);
            expect(exists).toBe(true);
            expect(getFromIdb).toHaveBeenCalledWith(albumPath);
            expectFetchCalledWithPath(albumPath);
        });

        it('should throw error for invalid album path', async () => {
            const invalidPath = 'invalid-path';

            await expect(albumLoadMachine.albumExists(invalidPath)).rejects.toThrow(
                `Invalid album path [${invalidPath}]`,
            );
        });

        it('should throw error for unexpected server response', async () => {
            const albumPath = '/2024/01-01/';

            mockIdbSuccess(undefined);
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 403, // Forbidden - unexpected status
            });

            await expect(albumLoadMachine.albumExists(albumPath)).rejects.toThrow(
                `Unexpected response [403] fetching album [${albumPath}]`,
            );
        });
    });
});
