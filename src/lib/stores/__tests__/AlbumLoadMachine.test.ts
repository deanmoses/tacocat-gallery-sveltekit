/**
 * Test suite for AlbumLoadMachine
 * Tests the state machine that handles loading album data from both IndexedDB and the server.
 * Verifies correct state transitions and error handling for various scenarios.
 */
import { describe, it, expect, vi, beforeEach, beforeAll, type Mock } from 'vitest';
import { albumLoadMachine } from '../AlbumLoadMachine.svelte';
import { albumState } from '../AlbumState.svelte';
import { AlbumStatus } from '$lib/models/album';
import { get as getFromIdb, set as setToIdb, del as delFromIdb } from 'idb-keyval';
import { createMockAlbumRecordFromPath } from './albumTestUtils';
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
    });
});
